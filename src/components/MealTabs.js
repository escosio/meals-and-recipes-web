import Nav from 'react-bootstrap/Nav';

function MealTabs( {handleTabChange} ) {
  return (
    <Nav fill variant="tabs" defaultActiveKey="/home">
      <Nav.Item>
        <Nav.Link href="/">All</Nav.Link>
      </Nav.Item>
      <Nav.Item onClick={() => handleTabChange("Breakfast")}>
        <Nav.Link eventKey="link-1">Breakfast</Nav.Link>
      </Nav.Item>
      <Nav.Item onClick={() => handleTabChange("Lunch")}>
        <Nav.Link eventKey="link-2">Lunch</Nav.Link>
      </Nav.Item>
      <Nav.Item onClick={() => handleTabChange("Dinner")}>
        <Nav.Link eventKey="link-3">Dinner</Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export default MealTabs;