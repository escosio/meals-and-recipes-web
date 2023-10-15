import React from "react";
import { Container, Stack, Form, Button } from "react-bootstrap";

function TopContainer() {
    <Container>
        <Stack direction="horizontal">
          {/* <form>
            <input type="text" />
            <button>Add Recipe</button>
          </form> */}
          <Form>
            <Form.Control type="text" />
            <Button>Add recipe</Button>
          </Form>
          <Button>Get a random Recipe</Button>
        </Stack>
      </Container>
}

export default TopContainer;