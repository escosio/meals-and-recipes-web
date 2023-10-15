import Form from "react-bootstrap/Form";

function ViewToggle(toggleText) {
  const text = toggleText;
  return (
    <Form>
      <Form.Switch // prettier-ignore
        type="switch"
        id="custom-switch"
        label="Toggle view"
        color="white"
      />
    </Form>
  );
}

export default ViewToggle;
