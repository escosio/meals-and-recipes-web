import Nav from 'react-bootstrap/Nav';

{/* <i class="fa-solid fa-hotdog"></i>
<i class="fa-solid fa-egg"></i>
<i class="fa-solid fa-utensils"></i>
<i class="fa-solid fa-burger"></i> */}

function MealTabs( {handleTabChange} ) {
  return (
    <Nav className='meal-tabs-container' fill variant="tabs" defaultActiveKey="all">
      <Nav.Item>
        <Nav.Link href="/" eventKey="all">All</Nav.Link>
      </Nav.Item>
      <Nav.Item onClick={() => handleTabChange("Breakfast")}>
        <Nav.Link eventKey="breakfast">Breakfast</Nav.Link>
      </Nav.Item>
      <Nav.Item onClick={() => handleTabChange("Lunch")}>
        <Nav.Link eventKey="lunch">Lunch</Nav.Link>
      </Nav.Item>
      <Nav.Item onClick={() => handleTabChange("Dinner")}>
        <Nav.Link eventKey="dinner">Dinner</Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export default MealTabs;