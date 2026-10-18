import { createContext, useContext } from "react";
import { buildLibrary } from "./recipes";

const RecipesContext = createContext(buildLibrary([]));

export const RecipesProvider = RecipesContext.Provider;

/** { recipes, getRecipe } for the merged built-in + custom library. */
export function useRecipes() {
  return useContext(RecipesContext);
}
