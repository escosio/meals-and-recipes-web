import "../css/App.css";

/**
 * Header component for application, has brand text and search bar. The function accepts a object parameter for recipe object data to use against search
 * @returns
 */
function Header({ data, searchAction }) {
  return (
    <nav className="headernav">
      <h1>
        Meals & Recipes <i class="fa-solid fa-utensils"></i>
      </h1>
    </nav>
  );
}

export default Header;
