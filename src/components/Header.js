import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { Button, Form, ListGroup, Nav, Stack } from "react-bootstrap";
import { useState } from "react";
import RecipeItem from "./RecipeItem";
import Search from "./Search";
import "../css/App.css";

/**
 * Header component for application, has brand text and search bar. The function accepts a object parameter for recipe object data to use against search
 * @returns
 */
function Header({ data, searchAction }) {
  // const recipeData = data;

  return (
    <Navbar variant="dark" bg="dark" className="headernav">
      <Navbar.Brand md={10} href="#home">
        Meals & Recipes <i class="fa-solid fa-utensils"></i>
      </Navbar.Brand>
      <Nav.Item>{/* <Search data={recipeData} /> */}</Nav.Item>
    </Navbar>
  );
}

export default Header;
