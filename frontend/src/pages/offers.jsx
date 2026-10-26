function Offers() {
  const offers = [
    {
      code: "YUMORA50",
      title: "50% OFF",
      description:
        "Get 50% off on your first order.",
      minimum: "Minimum order ₹299",
    },

    {
      code: "FOOD100",
      title: "₹100 OFF",
      description:
        "Get ₹100 off on orders above ₹499.",
      minimum: "Minimum order ₹499",
    },

    {
      code: "FREEDEL",
      title: "FREE DELIVERY",
      description:
        "Enjoy free delivery on selected restaurants.",
      minimum: "No minimum order",
    },

    {
      code: "WEEKEND",
      title: "30% OFF",
      description:
        "Weekend special discount on delicious food.",
      minimum: "Minimum order ₹399",
    },
  ];

  return (
    <div className="offers-page">

      <div className="offers-container">

        <div className="offers-header">

          <span>YUMORA SPECIALS</span>

          <h1>
            Offers & Discounts 🎁
          </h1>

          <p>
            Save more while enjoying your
            favorite food.
          </p>

        </div>

        <div className="offers-grid">

          {offers.map((offer) => (

            <div
              className="offer-card"
              key={offer.code}
            >

              <div className="offer-icon">
                🎟️
              </div>

              <h2>
                {offer.title}
              </h2>

              <p>
                {offer.description}
              </p>

              <small>
                {offer.minimum}
              </small>

              <div className="coupon-code">
                {offer.code}
              </div>

              <button>
                Apply Offer
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default Offers;