const Booking = require("../models/booking");
const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");

// Helper: count weekend nights (Fri & Sat) between two dates
function countWeekendNights(checkIn, checkOut) {
  let count = 0;
  let d = new Date(checkIn);
  while (d < checkOut) {
    const day = d.getDay();
    if (day === 5 || day === 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// Helper: is this listing configured for room-based booking?
function isRoomConfigured(listing) {
  return listing.totalRooms != null && listing.maxGuestsPerRoom != null;
}

// Helper: calculate full price breakdown (only called for configured listings)
function calculatePrice(listing, checkIn, checkOut, guestCount, roomCount) {
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const weekendNights = countWeekendNights(checkIn, checkOut);
  const weekdayNights = nights - weekendNights;

  const basePerRoom = listing.price || 0;
  const weekendPerRoom = listing.weekendPrice || basePerRoom;

  const baseTotal = (weekdayNights * basePerRoom + weekendNights * weekendPerRoom) * roomCount;
  const weekendSurcharge = weekendNights * (weekendPerRoom - basePerRoom) * roomCount;

  const baseCapacity = listing.maxGuestsPerRoom * roomCount;
  const extraGuests = Math.max(0, guestCount - baseCapacity);
  const extraGuestFee = extraGuests * (listing.extraGuestCharge || 0) * nights;

  const cleaningFee = (listing.cleaningFee || 0) * roomCount;

  let discountPercent = 0;
  if (nights >= 28 && listing.monthlyDiscount > 0) {
    discountPercent = listing.monthlyDiscount;
  } else if (nights >= 7 && listing.weeklyDiscount > 0) {
    discountPercent = listing.weeklyDiscount;
  }
  const subtotalBeforeDiscount = baseTotal + extraGuestFee + cleaningFee;
  const discount = Math.round(subtotalBeforeDiscount * discountPercent / 100);
  const subtotalAfterDiscount = subtotalBeforeDiscount - discount;

  const gst = Math.round(subtotalAfterDiscount * 0.18);
  const totalPrice = subtotalAfterDiscount + gst;

  return {
    nights,
    weekendNights,
    priceBreakdown: { baseTotal, weekendSurcharge, extraGuestFee, cleaningFee, discount, gst },
    totalPrice,
    discountPercent,
  };
}

module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing!");
    return res.redirect(`/listings/${id}`);
  }

  // Only allow booking if owner has configured rooms
  if (!isRoomConfigured(listing)) {
    req.flash("error", "This listing is not available for booking yet!");
    return res.redirect(`/listings/${id}`);
  }

  const { checkIn, checkOut, guests, rooms } = req.body.booking;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const guestCount = parseInt(guests);
  const roomCount = parseInt(rooms) || 1;

  // Date validations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    req.flash("error", "Check-in date cannot be in the past!");
    return res.redirect(`/listings/${id}`);
  }
  if (checkOutDate <= checkInDate) {
    req.flash("error", "Check-out must be after check-in!");
    return res.redirect(`/listings/${id}`);
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

  // Min/max stay — only enforce if owner configured them
  if (listing.minStay && nights < listing.minStay) {
    req.flash("error", `Minimum stay is ${listing.minStay} night(s)!`);
    return res.redirect(`/listings/${id}`);
  }
  if (listing.maxStay && nights > listing.maxStay) {
    req.flash("error", `Maximum stay is ${listing.maxStay} night(s)!`);
    return res.redirect(`/listings/${id}`);
  }

  // Availability window — only enforce if set
  if (listing.availableFrom && checkInDate < new Date(listing.availableFrom)) {
    req.flash("error", "Selected dates are outside the availability window!");
    return res.redirect(`/listings/${id}`);
  }
  if (listing.availableTo && checkOutDate > new Date(listing.availableTo)) {
    req.flash("error", "Selected dates are outside the availability window!");
    return res.redirect(`/listings/${id}`);
  }

  // Blocked dates check
  if (listing.blockedDates && listing.blockedDates.length > 0) {
    for (let block of listing.blockedDates) {
      if (checkInDate < new Date(block.to) && checkOutDate > new Date(block.from)) {
        req.flash("error", "Some of your selected dates are blocked by the host!");
        return res.redirect(`/listings/${id}`);
      }
    }
  }

  const configured = true; // guaranteed by the guard above

  // Guest capacity check
  const maxCapacity = listing.maxGuestsPerRoom * roomCount;
  if (guestCount > maxCapacity) {
    req.flash("error", `${roomCount} room(s) can hold max ${maxCapacity} guests. Add more rooms or reduce guests.`);
    return res.redirect(`/listings/${id}`);
  }

  // Room availability check
  const overlappingBookings = await Booking.find({
    listing: id, status: "confirmed",
    checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate },
  });

  let maxRoomsBooked = 0;
  let d = new Date(checkInDate);
  while (d < checkOutDate) {
    let roomsOnDay = 0;
    for (let b of overlappingBookings) {
      if (d >= new Date(b.checkIn) && d < new Date(b.checkOut)) {
        roomsOnDay += b.rooms || 1;
      }
    }
    maxRoomsBooked = Math.max(maxRoomsBooked, roomsOnDay);
    d.setDate(d.getDate() + 1);
  }

  const availableRooms = listing.totalRooms - maxRoomsBooked;
  if (roomCount > availableRooms) {
    req.flash("error", `Only ${availableRooms} room(s) available for the selected dates!`);
    return res.redirect(`/listings/${id}`);
  }

  // Calculate price
  const calc = calculatePrice(listing, checkInDate, checkOutDate, guestCount, roomCount);

  const booking = new Booking({
    listing: id,
    guest: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: guestCount,
    rooms: roomCount,
    priceBreakdown: calc.priceBreakdown,
    totalPrice: calc.totalPrice,
  });

  await booking.save();

  const nightsLabel = `${calc.nights} night${calc.nights > 1 ? "s" : ""}`;
  const roomsLabel = roomCount > 1 ? `, ${roomCount} rooms` : "";
  req.flash("success", `Booking confirmed! ${nightsLabel}${roomsLabel} — ₹${calc.totalPrice.toLocaleString("en-IN")} total`);
  res.redirect("/bookings");
};

module.exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });
  res.render("bookings/index", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing");

  if (!booking) {
    req.flash("error", "Booking not found!");
    return res.redirect("/bookings");
  }
  if (!booking.guest.equals(req.user._id)) {
    req.flash("error", "You don't have permission to cancel this booking!");
    return res.redirect("/bookings");
  }
  if (booking.status === "cancelled") {
    req.flash("error", "This booking is already cancelled!");
    return res.redirect("/bookings");
  }

  // Can't cancel past bookings
  if (new Date(booking.checkIn) < new Date()) {
    req.flash("error", "You cannot cancel a past booking!");
    return res.redirect("/bookings");
  }

  // Fix #4: Only apply refund logic if owner set a cancellation policy
  const policy = booking.listing ? booking.listing.cancellationPolicy : null;

  booking.status = "cancelled";
  await booking.save();

  if (!policy) {
    // No policy configured — just cancel, no refund messaging
    req.flash("success", "Booking cancelled successfully!");
  } else {
    const daysUntilCheckIn = Math.ceil((new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60 * 24));
    let refundPercent = 0;

    if (policy === "flexible") {
      refundPercent = daysUntilCheckIn >= 1 ? 100 : 0;
    } else if (policy === "moderate") {
      refundPercent = daysUntilCheckIn >= 5 ? 100 : 0;
    } else if (policy === "strict") {
      refundPercent = daysUntilCheckIn >= 7 ? 50 : 0;
    }

    const refundAmount = Math.round(booking.totalPrice * refundPercent / 100);
    if (refundPercent > 0) {
      req.flash("success", `Booking cancelled. Refund: ₹${refundAmount.toLocaleString("en-IN")} (${refundPercent}%)`);
    } else {
      req.flash("success", "Booking cancelled. No refund applicable as per the cancellation policy.");
    }
  }
  res.redirect("/bookings");
};

// ── Owner Dashboard ──
module.exports.ownerDashboard = async (req, res) => {
  // If user has no listings, still show dashboard (they can create from here)
  const listings = await Listing.find({ owner: req.user._id });

  const listingIds = listings.map((l) => l._id);
  const bookings = await Booking.find({ listing: { $in: listingIds } })
    .populate("listing")
    .populate("guest")
    .sort({ createdAt: -1 });

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const upcomingBookings = confirmedBookings.filter((b) => new Date(b.checkIn) > new Date());

  res.render("bookings/dashboard", {
    listings, bookings, totalRevenue,
    upcomingCount: upcomingBookings.length,
    totalBookings: confirmedBookings.length,
  });
};

// ── Block/Unblock Dates ──
module.exports.blockDates = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect("/bookings/dashboard");
  }

  const { from, to, reason } = req.body;
  const fromDate = new Date(from);
  const toDate = new Date(to);

  // Fix #10: Validate block dates
  if (fromDate >= toDate) {
    req.flash("error", "Block 'From' date must be before 'To' date!");
    return res.redirect("/bookings/dashboard");
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (toDate <= today) {
    req.flash("error", "Cannot block dates in the past!");
    return res.redirect("/bookings/dashboard");
  }

  listing.blockedDates.push({ from: fromDate, to: toDate, reason: reason || "Blocked" });
  await listing.save();
  req.flash("success", "Dates blocked successfully!");
  res.redirect("/bookings/dashboard");
};

module.exports.unblockDates = async (req, res) => {
  const { id, blockIndex } = req.params;
  const listing = await Listing.findById(id);

  if (!listing || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect("/bookings/dashboard");
  }

  listing.blockedDates.splice(parseInt(blockIndex), 1);
  await listing.save();
  req.flash("success", "Dates unblocked!");
  res.redirect("/bookings/dashboard");
};

// Fix #7: Availability API — handle unconfigured listings properly
module.exports.checkAvailability = async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res.json({ available: false, rooms: 0, configured: false });
  }

  const listing = await Listing.findById(id);
  if (!listing) return res.json({ available: false, rooms: 0, configured: false });

  const configured = isRoomConfigured(listing);

  if (!configured) {
    // Unconfigured: just check if any overlap exists
    const overlap = await Booking.findOne({
      listing: id, status: "confirmed",
      checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) },
    });
    return res.json({ available: !overlap, rooms: 0, configured: false });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const overlapping = await Booking.find({
    listing: id, status: "confirmed",
    checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate },
  });

  let maxRoomsBooked = 0;
  let d = new Date(checkInDate);
  while (d < checkOutDate) {
    let roomsOnDay = 0;
    for (let b of overlapping) {
      if (d >= new Date(b.checkIn) && d < new Date(b.checkOut)) {
        roomsOnDay += b.rooms || 1;
      }
    }
    maxRoomsBooked = Math.max(maxRoomsBooked, roomsOnDay);
    d.setDate(d.getDate() + 1);
  }

  const availableRooms = Math.max(0, listing.totalRooms - maxRoomsBooked);
  res.json({ available: availableRooms > 0, rooms: availableRooms, configured: true });
};
