import React from "react";
import { Button, Stack } from "react-bootstrap";

export const SwiftView = () => {
  return (
    <>
      <Stack gap={2} className="home-screen">
        <Button className="recipe-button">Breakfast</Button>
        <Button className="recipe-button">Lunch</Button>
        <Button className="recipe-button">Dinner</Button>
        <Button className="recipe-button">All</Button>
      </Stack>
    </>
  );
};
