import { Link } from '@tanstack/react-router';

function NotFound() {
  return (
    <div className="utility-page-wrap">
      <div className="w-layout-blockcontainer container-default width-100 w-container">
        <div className="utility-page-content _404-not-found-content">
          {/* Card */}
          <div className="card _404-not-found-card">
            <div className="inner-container _670px text-center">
              <div className="display-12 text-neutral-800">404</div>
              <div className="mg-bottom-16px">
                <h1 className="display-12">Page not found.</h1>
              </div>
              <div className="mg-bottom-32px">
                <p className="paragraph-large">
                  That link doesn’t go anywhere. If you were trying to book, you can book a
                  reservation now, or head back home.
                </p>
              </div>
              <div className="buttons-row justify-center wrap">
                <Link to="/" className="button-primary large w-inline-block">
                  <div className="text-block">Go back home</div>
                </Link>
                <Link to="/reservation" className="button-primary large w-inline-block">
                  <div className="text-block">Book a reservation</div>
                </Link>
                <Link to="/shop" className="link center-mbp w-inline-block">
                  <div>Browse the shop</div>
                  <div className="item-icon-right medium">
                    <div className="icon-font-rounded"></div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
