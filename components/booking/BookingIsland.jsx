"use client";
import BookingForm from "../BookingForm";
// Thin client-only wrapper so we can code-split the heavier booking logic
// without shipping it in the initial HTML/JS for fare & SEO content pages.
export default function BookingIsland(props) {
    return <BookingForm {...props}/>;
}
