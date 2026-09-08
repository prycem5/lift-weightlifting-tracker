import { useState, useEffect } from "react";

/* 
General flow:
1. on load, do mass GET.
2. take result into exercises array.
3. when input's value change, useEffect to call search() method
    3.1. filteredExercises = exercises.filter((exercise) => exercise.name.toLowerCase() === keyword.toLowerCase());
    3.2. return filteredExercises 
    3.3. map filteredExercises to display in a list.
*/