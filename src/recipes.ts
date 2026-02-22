type Recipe = {
  meal: mealType;
  mealName: string;
  ingredient: string;
  instructions: string;
};

type mealType = "Breakfast" | "Lunch" | "Dinner" | "All";

export const recipes: Recipe[] = [
  {
    meal: "Breakfast",
    mealName: "Pancakes",
    ingredient:
      "1 cup pancake mix, 1 egg, 1 tbsp oil, 3/4 cup milk, chocolate chips",
    instructions: "mix ingredients and heat on pan",
  },
  {
    meal: "Breakfast",
    mealName: "French Toast",
    ingredient:
      "1 egg\n1 teaspoon McCormick® All Natural Pure Vanilla Extract\n1/2 teaspoon McCormick® Ground Cinnamon\n1/4 cup milk\n4 slices hearty sandwich bread",
    instructions:
      "1. To make this easy French toast recipe:\nWhisk egg, vanilla and cinnamon in shallow dish. Stir in milk.\n2. Dip bread slices in egg mixture, turning to coat evenly on both sides.\n3. Cook bread slices on lightly greased nonstick griddle or skillet on medium heat until cooked through and browned on both sides. Serve with Easy Spiced Syrup (recipe follows), if desired. Voila, easy French toast.\n4. Easy Spiced Syrup: Add 1 teaspoon McCormick® Pure Vanilla Extract and 1/4 teaspoon McCormick® Ground Cinnamon to 1 cup pancake syrup; stir well to mix. Serve warm, if desired.",
  },
  {
    meal: "Breakfast",
    mealName: "Waffles & Sausages",
    ingredient: "waffles, sausages, Peanut Butter",
    instructions:
      "Toast Waffles, spread PB, sausages in the microwave for 30 sec each side",
  },
  {
    meal: "Breakfast",
    mealName: "Zucchini Muffins",
    ingredient:
      "1 ⅔ cup / 200 g buckwheat flour (or other flour)\n1 tsp. / 5 mL baking powder\n1 tsp. / 5 mL baking soda\n1 tsp. / 5 mL cinnamon\n½ tsp. / 2.5 mL salt\n½ cup milk / 120 mL milk of choice\n1 large egg\n½ cup / 120 mL maple syrup or honey\n¼ cup / 60 mL avocado oil (or other oil for baking)\n1 tsp. / 5 mL vanilla\n½ cup chocolate chips\n2 cups / 480 mL shredded zucchini (squeezed in a towel to remove extra liquid) ",
    instructions:
      "Preheat oven to 350 degrees F / 175 degrees C. Prepare muffin tins by greasing or using papers.\n In a large bowl, mix flour, baking powder, baking soda, cinnamon and salt.\n In a separate bowl, whisk together milk, egg, maple syrup, oil and vanilla.\n Pour wet ingredients into dry ingredients. Stir just enough to incorporate the ingredients.\n Stir zucchini and chocolate chips into the the batter.\n Spoon batter into muffin tins.\n Bake for approximately 16 minutes or until a toothpick or knife inserted into the center comes out clean.",
  },
  {
    meal: "Breakfast",
    mealName: "Blueberry muffins",
    ingredient: "Mix, 1 egg, 1/4 cup of milk",
    instructions: "Mix ",
  },
  {
    meal: "Breakfast",
    mealName: "Oatmeal",
    ingredient: "",
    instructions: "",
  },
  {
    meal: "Dinner",
    mealName: "Meatballs",
    ingredient:
      "1 lb. Beef\none egg\nabout 1/2 cup GF bread crumbs\n1 teaspoon salt\n1/2 tsp garlic powder\nsome dried parsley\nsome dried basil\nsome grated cheese\na splash of water or milk for moistness\nMix up well and shape into balls.",
    instructions:
      "More breadcrumbs, 2 GF bread toasted then in a blender. \n\n425 for 15 min\n\nSJ:\nMilk \nBreadcrumbs \nItalian seasoning \nSalt and pepper \nGarlic powder \n\nFrom SJ\nBlend cooled bread\nPut in bowl\nAdd salt, pepper, garlic powder, herbs\nAdd a tiny bit of milk at a time, stirring, until you have a thick slurry\nMix in beef\nMeatballify\n\nBake at 425 for 15 minutes",
  },
  {
    meal: "Dinner",
    mealName: "Pork chops & arroz",
    ingredient:
      "- Get thin pork chops\n- Milk\n- Oil\n- Rice\n- Beans\n- Onions",
    instructions:
      "Season chops with adobo\nOil pan\nPour milk onto chops (instead of egg)\nBread chops in plate\nPut oil on top \n10 min on broil (one side)\n\n1 cup rice, 2 cup water\nBoil water throw in salt and oil \nLet the water boil Down\n\nFor beans \n1/4 onion\n1 garlic clove\n1/4 of tomato sauce( less)\nCouple chunks of sofrito 4tbsp\nCook on low",
  },
  {
    meal: "Dinner",
    mealName: "Gnocchi",
    ingredient: "tbd",
    instructions: "tbd",
  },
  {
    meal: "Dinner",
    mealName: "Hot Dogs",
    ingredient: "Hot Dogs, Hot Dog buns",
    instructions: "Preheat 375, 5min on one side then 3 on the other.",
  },
  {
    meal: "Dinner",
    mealName: "Tacos",
    ingredient: "Taco kit, Mexican Cheese, Ground beef, Tomatoes, Greens",
    instructions:
      "Cook beef in a pan, break it up and cook for 7 minutes. Add seasonings and continue to cook",
  },
  // {
  //   meal: "Dinner",
  //   mealName: "Steak & Potatoes",
  //   ingredient:
  //     "2 (12-oz) New York strip or ribeye steaks or 4 (6-oz) filet mignons, about 1½ inches thick\n1 heaping teaspoon kosher salt\n½ teaspoon freshly ground black pepper\n2 tablespoons vegetable oil\n1 tablespoon unsalted butter\nA few sprigs fresh thyme leaves",
  //   instructions:
  //     "To begin, pat the steaks dry with paper towels.\nSeason the steaks all over with the salt and pepper.\nTurn on your exhaust fan and heat a heavy pan (preferably cast iron or stainless steel) over medium-high heat until it's VERY hot.\nAdd the oil to the pan and heat until it begins to shimmer and move fluidly around the pan.\nCarefully set the steaks in the pan, releasing them away from you so the oil doesn’t splatter in your direction. The oil should sizzle.\nLeave the steaks alone! Avoid the temptation to peek or fiddle or flip repeatedly; the steaks need a few minutes undisturbed to develop a golden crust. Flip the steaks when they release easily and the bottom is a deep-brown color, about 3 minutes. Continue to cook the steaks for another 3 to 4 minutes on the second side for rare to medium-rare. (For medium, cook 4 to 5 minutes on second side; for well-done, cook 5 to 6 minutes on second side).\nDuring the last minute of cooking, add the butter and thyme sprigs to the pan with the steaks.\nIf you are serving the steaks unsliced, transfer them to plates and serve hot. If you plan to slice the steaks, transfer them to a cutting board and let rest, covered with aluminum foil, for 5 to 10 minutes; then slice thinly against the grain.",
  // },
  {
    meal: "Dinner",
    mealName: "Empanadas",
    ingredient:
      "1 pound of lean ground beef\n1/3 cup of homemade sofrito\n1/3 cup of tomato sauce\n1 packet of sazon con achiote\n1 tablespoon of adobo all purpose seasoning\n2 teaspoons of ground cumin\n1 teaspoon of dried oregano\n1 teaspoon of red pepper flakes\n2 1/2 cups of small diced potatoes (frozen potatoes work too)\n1 package of Goya Brand- Empanada Discos con Achiote",
    instructions:
      "Defrost frozen empanada dough for 2-3 hours.\nOn medium heat cook homemade sofrito with tomato sauce until fragrant. Then add lean ground beef.\nCrumble the meat and season with sazon, adobo, cumin, dried oregano and red pepper flakes.\nOnce meat is brown add diced potatoes and allow remaining liquid to steam potatoes until tender. Cool your mixture.\nOn a flat surface, sprinkle some all purpose flour and lay out your empanada dough.\nAdd a tablespoon of the meat mixture in the center of the dough. Fold over the dough and firmly press with your thumbs. To properly seal the seam, crimp the edges with a fork.\nIn hot oil, fry the empanadas for 1 minute on each side. Let them rest on a paper-towel and enjoy!",
  },
  // {
  //   meal: "Dinner",
  //   mealName: "Meatloaf",
  //   ingredient:
  //     "1 1/2 lbs pound ground chuck beef\n  3/4 chopped onion\n 1 egg\n 2 tbps ketchup\n 1 cup milk\n 1 tsp salt\n breadcrumb evenly over top(optional)",
  //   instructions: "tbd",
  // },
  {
    meal: "Dinner",
    mealName: "Chicken Parm (or Eggplant)",
    ingredient: "Italian bread \nSauce\nMozzarella cheese\nChicken \nEgg",
    instructions:
      "Make Breadcrumbs\nPreheat the oven to 425\nMake breadcrumbs and put on a plate\nTenderize the chicken a bit\nPut Egg into bowl\n\nDip chicken in the egg then on the plate of breadcrumbs\nThen drop on the pan and put in over for 10 min\nAfter 10 min, flip cutlet and put sauce and cheese on chicken \nHeat for another 10 min",
  },
  {
    meal: "Dinner",
    mealName: "Fried Rice and dumplings",
    ingredient: "tbd",
    instructions: "tbd",
  },
  // {
  //   meal: "Dinner",
  //   mealName: "Nuggets, Mashed Potatoes, Green Beans",
  //   ingredient:
  //     "Frozen Nuggets, Quick Mash potato mix, Green beans, olive oil, garlic clove or paste",
  //   instructions:
  //     "Green beans: https://www.recipetineats.com/garlic-sauteed-green-beans/",
  // },
  {
    meal: "Dinner",
    mealName: "Pizza",
    ingredient: "N/A",
    instructions:
      "order from Bay Ridge Pizza https://www.seamless.com/menu/bay-ridge-pizzeria-7704-5th-ave-brooklyn/272804",
  },
  {
    meal: "Dinner",
    mealName: "Raviolis",
    ingredient: "frozen raviolis",
    instructions: "boil water and then cook for 5min",
  },
  {
    meal: "Dinner",
    mealName: "Green beans and sausage",
    ingredient: "tbd",
    instructions: "SJ",
  },
  {
    meal: "All",
    mealName: "Smoothie",
    ingredient:
      "Banana\nBlueberries\nFrozen spinach\nApplesauce\nPeanut butter\nLittle bit of water ",
    instructions: "Add items to blender as stick a straw in, voila!",
  },
  {
    meal: "Dinner",
    mealName: "Roasted Chicken and Veggies with Rice",
    ingredient:
      "Chicken pieces (thighs shown)\nVegetables, cut into pieces (smaller/thinner pieces cook faster) Oil, for drizzling (I used avocado oil)\nWhite rice (jasmine rice shown, cooked using 1:1.5 ratio of rice to water) Salt, pepper, or other herbs/spices for vegetables (optional) Other sauce or seasoning for chicken (optional)\nButter/olive oil (optional)",
    instructions:
      "1. Preheat oven to 375 degrees F / 190 degrees C.\n2. Put chicken in an oven-safe dish. Cover tightly with an oven-safe lid or with foil.\n3. Put chopped veggies on a baking sheet. Drizzle with oil, salt, pepper, or any spices you are using for the chicken. Use your hands to make sure all veggies are coated with oil. Cover the baking sheet with foil, shiny side down toward the veggies.\n4. Bake for approximately 25 minutes. See time saver note for alternate cooking methods.\n5. Once chicken and veggies are in the oven, cook rice according to package directions.\n6. Serve rice with butter or olive oil, if desired.",
  },
  {
    meal: "Dinner",
    mealName: "Ropa Vieja",
    ingredient:
      "3 pound beef chuck roast with fat cap\n1 cup homemade sofrito recipe linked above\n10 spanish stuffed olives (chopped) optional\n3-5 small bay leaves\n1 tablespoon dried oregano\n1 tablespoon garlic powder\n2 tablespoons ground cumin\n1 tablespoon smoked paprika\n1 tablespoon adobo all purpose seasoning\n2 packets sazon with culantro y achiote\n6 oz tomato paste\n15 oz crushed tomatoes 5-6 fresh diced tomatoes\n2 tablespoons ketchup\n8 cups chicken broth\nsalt and pepper to taste\nolive oil as needed",
    instructions:
      "Preheat oven to 250ºF. Cut the chuck roast in half so it will be able to fit into caldero or dutch pot.\nLiberally season the chuck roast with coarse salt and black pepper. Massage in seasoning. Set aside and let rest for about 20 minutes or until the meat is room temperature. Make sure the meat isn’t cold prior to searing. An even room temperature allows for an even sear\nIn your Dutch pot, add enough olive oil to coat the bottom. Sear the meat on each side, about 4-5 minutes. Leave beef drippings in pot and set the meat aside while you work on the braising liquid.\nIn the same pot with beef drippings, add sofrito and sauté for about 5 minutes. Then add the olives, dried oregano, granulated garlic, ground cumin, smoked paprika, adobo and sazón. Toast the spices and let them bloom a bit, about 2 minutes or until fragrant\nAdd the tomato paste and stir well until fully incorporated. Then add the crushed tomatoes, ketchup, and broth.\nLastly, add the bay leaves and nestle the seared chuck roast into the braising liquid and cover with the lid. Cook in the oven for 3 hours, fully covered.\nAfter the 3 hours, remove the pot from the oven and remove the meat. Set aside and shred with two forks or with your hands when cool enough to handle.\nMeanwhile, on the stove, bring the braising liquid to a boil and skim any fat that is on the top. Boil for about 10-15 minutes to reduce and thicken up; fold the shredded beef back into the sauce.\nServe the ropa vieja with white rice and enjoy!\n\nhttps://www.nataknowsbest.com/puerto-rican-ropa-vieja/\n",
  },
  {
    meal: "Dinner",
    mealName: "Arroz con Gandules",
    ingredient:
      "2 cups rinsed white rice long grain\n3 cups water\n1 tablespoon olive oil\n1 15 ounce can of gandules (rinsed and drained) Alternatives are frozen or fresh gandules\n1/3 cup of homemade sofrito linked above\n1/3 cup tomato sauce or tomato paste\n1/3 cup fully cooked, cubed country ham or chunks of pernil pork shoulder\n2 tablespoon stuffed olives (drained) optional\n2 - 3 bays leaves optional\n1 packet sazon with achiote y culantro goya or loiza brand\n2-3 tablespoons adobo all purpose seasoning or to desired taste\n1 teaspoon dried oregano\nsalt if needed",
    instructions:
      "In a dutch oven pot or caldero, heat olive oil at medium-high heat. Add sofrito, tomato sauce and cooked diced country ham or pork chunks. Cook until fragrant (roughly 5 minutes) and flavors are well infused.\nThen add gandules. If canned, rinse and drain. If frozen, do not thaw. If fresh, add in without manipulation. Next add bay leaves for extra flavoring. Allow to infuse with sofrito tomato base.\nIf desired add stuffed olives. Next, pour room temperature water in the dutch pot, stir lightly and begin to heavily season.\nAdd sazon, adobo, dried oregano and salt if needed. Carefully taste and adjust seasonings to liking.\nAllow water to come to boil then add rinsed rice. Stir once or twice and leave untouched. Avoid over-stirring, as it creates extra starch and mushiness. Cook rice uncovered until water is mostly absorbed.\nOnce most of the visible surface liquid is absorbed, gently stir the rice once more, and lower the heat and cover. Allow low heat to steam rice for 20-25 minutes.\nThe arroz con gandules will be done when all liquid is absorbed, rice is fluffy and peas are tender. Remove bay leaves before serving.",
  },
  {
    meal: "Dinner",
    mealName: "Broccoli Rabe and Sausage Pasta",
    ingredient: "",
    instructions: "https://pinchandswirl.com/broccoli-rabe-and-sausage-pasta/",
  },
  {
    meal: "Dinner",
    mealName: "Penne Alla Vodka",
    ingredient:
      "2 Chicken breasts seasoned with salt and black pepper and cubed\n1 lb. Penne pasta\n28 oz. Tomato passata\n7 oz. Heavy cream\n4 oz. Vodka\n1/2 Sweet onion minced\n3 Garlic cloves minced\nPecorino cheese for topping\nParsley for topping\nExtra virgin olive oil",
    instructions:
      "Bring a large pot of salted water to a boil. This will be used to cook the pasta.\nIn a deep sauté pan or dutch oven, add a large drizzle of olive oil. Once it is hot, add the chicken and sauté until tender over a medium to high flame. It does not need to be fully cooked as it will continue cooking in the sauce later.\nAdd in the garlic and onion and sauté for about three minutes.\nLower the flame to medium/low and pour in the vodka. Raise the flame again to medium and cook for about three minutes to allow the alcohol to evaporate. The vodka amplifies the flavor of the sauce while also helping to keep the heavy cream from separating when added to the tomato sauce.\nRaise the flame to medium/high and pour in the tomato passata. Mix together and bring to a boil. Once boiling, reduce to a simmer and allow to cook for at least ten minutes.\nMeanwhile, add the penne into the pot of boiling water. Cook the pasta for one to two minutes less than the package instructions or al dente.\nTwo minutes before the pasta is ready, taste the sauce and season with salt and black pepper if needed. Pour the heavy cream into the sauce pan and mix together.\nOnce the penne is ready, use a hand strainer to scoop it directly into the vodka sauce dutch oven/pan. Mix together and allow to finish cooking for another two minutes in the pan.\nRemove from the pan and serve with a sprinkle of freshly chopped parsley and pecorino cheese. Salute and cin cin!",
  },
  {
    meal: "Dinner",
    mealName: "Pepper Steak Stir Fry",
    ingredient:
      "1 tablespoon vegetable oil divided use\n1 red bell pepper cored, seeded and cut into strips\n1 green bell pepper cored, seeded and cut into strips\n1 1/4 pounds flank steak thinly sliced\n2 teaspoons minced garlic\n1 teaspoon minced ginger\nsalt and pepper to taste\n1/4 cup soy sauce\n1 1/2 tablespoons sugar\n1 1/2 tablespoons cornstarch",
    instructions:
      "Heat 1 teaspoon of the vegetable oil over medium high heat in a large pan.\nAdd the peppers and cook for 3-4 minutes or until just tender. Remove the peppers from the pan and place on a plate.\nAdd the remaining oil to the pan. Season the flank steak with salt and pepper to taste.\nIncrease heat to high. Add the steak to the pan and cook for 5-6 minutes or until lightly browned.\nAdd the garlic and ginger, then cook for 30 seconds.\nPlace the peppers back in the pan with the steak.\nIn a small bowl, whisk together the soy sauce, sugar, 1/4 cup water and cornstarch. \nPour the sauce over the steak mixture and bring to a simmer. Cook for 2-3 minutes or until sauce has just thickened, then serve.",
  },
  {
    meal: "Dinner",
    mealName: "Buttery Rice and Chicken",
    ingredient: "",
    instructions: "",
  },
  {
    meal: "Dinner",
    mealName: "Zesty Fried Chicken",
    ingredient:
      "1/2 c. buttermilk\n2 tsp. no-salt blackening seasoning\nkosher salt\n4 c. cornflakes\n1 tbsp. olive oil\n1/2 c. fresh flat-leaf parsley, chopped\n8 small chicken drumsticks (about 2 lb.), skin removed",
    instructions:
      "STEP 1\nHeat oven to 375 degrees F. Line a rimmed baking sheet with nonstick foil. In a shallow bowl, combine the buttermilk, blackening seasoning and 3/4 teaspoon salt.\nSTEP 2\nFinely crush the cornflakes and transfer to a second bowl. Toss with the oil, then the parsley.\nSTEP 3\nDip the chicken in the buttermilk, letting any excess drip off, then coat in the cornflakes, pressing gently to help them adhere. Transfer to the prepared baking sheet.\nSTEP 4\nBake until the chicken is golden brown and cooked through, 30 to 35 minutes.",
  },
  {
    meal: "Dinner",
    mealName: "Grilled Cheese",
    ingredient: "Butter\nCheese\nBread",
    instructions:
      "Step 1\nSpread 1 tablespoon butter on one side of each slice of bread. With butter side down, top each slice of bread with about ½ cup cheddar. \nStep 2\nIn a skillet over medium heat, melt 1 tablespoon butter. Add two slices of bread, butter side down. Cook until bread is golden and cheese is starting to melt, about 2 minutes. Flip one piece of bread on top of the other and continue to cook until cheese is melty, about 30 seconds more. \nStep 3\nRepeat for the second sandwich, wiping skillet clean if necessary. ",
  },
  {
    meal: "Lunch",
    mealName: "Escarole Soup",
    ingredient:
      "2 bunches of fresh escarole, \n2 or 3 boxes of chicken broth, \n1 lb of ground meat (beef or turkey), \na clove of garlic",
    instructions:
      "Cook down the escarole in a large pot with some water and make the meatballs using the recipe for Sunday meatballs but roll them smaller. \nAdd the garlic and broth and let it boil. \nAdd the meatballs and they will cook in the broth. \nIf you need more broth add water and Better Than Bouillon. \nSprinkle in adobo, salt and pepper to taste. \nYou can add GF noodles if you want. Serve with grated Parmesan. That’s it!",
  },
  {
    meal: "Dinner",
    mealName: "Chicken Alfredo",
    ingredient: "Chicken, Fettuccine, Rao's Alfredo Sauce",
    instructions:
      "Season and tenderize the chicken, then pan-fry in oil and butter, for 6 minutes a side, or until an internal temperature reaches 165 degrees F. Transfer to a cutting board and let rest for a few minutes, then cut into 1/2-inch thick slices. Tent with foil, while you prepare the sauce. \n boil pasta and then put chicken in a pan with the alfredo sauce and heat for 5 min. Serve over pasta.",
  },
  {
    meal: "Dinner",
    mealName: "Chicken Pesto",
    ingredient: "Chicken, Pesto, Pasta",
    instructions: "tbd",
  },
  {
    meal: "All",
    mealName: "Potato Salad",
    ingredient:
      "5 pounds red potatoes, chopped, 3 cups mayonnaise, 2 cups finely chopped pickles, 5 large hard-cooked eggs, chopped, ½ cup chopped red onion,½ cup chopped celery, 3 tablespoons prepared mustard, 1 tablespoon apple cider vinegar,1 teaspoon salt, or to taste,  ½ teaspoon ground black pepper",
    instructions: "https://www.allrecipes.com/recipe/232864/potato-salad/",
  },
  {
    meal: "Dinner",
    mealName: "Spahetti, Tomatoes and Chicken",
    ingredient:
      "2 skinless chicken breast halves (1 lb), diced in 1 inch cubes, cooking spray, 1/2 tsp each of dried oregano and dried basil, kosher salt and fresh pepper, to taste, 8 oz spaghetti, gluten-free or whole wheat, 2 cups grape tomatoes, halved, 6 cloves garlic, smashed and coarsely chopped, 4 tsp extra virgin olive oil, 4 tbsp chopped fresh basil",
    instructions:
      "Bring a large pot of salted water to boil., Season chicken generously with salt, pepper, oregano and basil., Heat a large skillet on high heat. When hot, spray with oil and add chicken. Cook about 3-4 minutes, until no longer pink., Remove chicken and set aside., Add pasta and cook according to package directions. Reserve about 1/2 cup pasta water before draining., While pasta cooks, add olive oil to skillet on high heat., Add garlic and sauté until golden brown (do not burn). Add tomatoes, salt and pepper and reduce heat to medium-low. Sauté about 4-5 minutes., When pasta is drained, add pasta to tomatoes and toss well. If pasta seems too dry, add some of the reserved pasta water., Add fresh basil and chicken and toss well. Serve and top with good grated cheese.",
  },
  {
    meal: "Dinner",
    mealName: "Chile",
    ingredient: "n/a",
    instructions:
      "https://www.delish.com/cooking/recipe-ideas/a58253/best-homemade-chili-recipe/",
  },
];

export default recipes;
