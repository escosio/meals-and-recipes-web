import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Button, Col, Form, FormControl, Row } from "react-bootstrap";
import { useState } from "react";

/**
 * Header component for application
 * @returns 
 */
function Header() {
  const [searchValue, updateSearchValue] = useState("");

  const handleSearch = (e) => {
    console.log(searchValue);
  };

  return (
    <Navbar variant="dark" bg="dark" expand="lg">
      <Container fluid>
        <Navbar.Brand href="#home">Meals & Recipes</Navbar.Brand>
        {/* <Navbar.Collapse id="navbar-dark-example">
          <Nav>
            <NavDropdown
              id="nav-dropdown-dark-example"
              title="Meals"
              menuVariant="dark"
            >
              <NavDropdown.Item href="#action/3.1">Breakfast</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">Lunch</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">Dinner</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#action/3.4">All</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse> */}
        <Form onSubmit={handleSearch}>
          <Form inline>
            <Row >
              <Col xs="auto">
                <Form.Control
                  type="search"
                  value={searchValue}
                  onChange={(e) => updateSearchValue(e.target.value)}
                  placeholder="Search recipe..."
                  className="mr-sm-2"
                />
              </Col>
              <Col>
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Form>
      </Container>
    </Navbar>
  );
}

export default Header;
