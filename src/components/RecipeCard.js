import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import RecipeModal from './RecipeItem';

// To be deleted, now a list item
const RecipeCard = ({recipeData}) => {
  console.log(recipeData)
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Body>
        <Card.Title>{recipeData.mealName}</Card.Title>
        <Card.Subtitle>{recipeData.meal}</Card.Subtitle>
        <Card.Text>
          {recipeData.ingredient}
        </Card.Text>
        <Button variant="primary" onClick={<RecipeModal />}>See Recipe</Button>
      </Card.Body>
    </Card>
  );
}

export default RecipeCard;