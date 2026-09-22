"use client";

interface TileProps {
  letter: string;
  state: "empty" | "filled" | "green" | "orange" | "grey" | "active";
}

export default function Tile({ letter, state }: TileProps) {
  const classes = ["tile"];
  if (state !== "empty") classes.push(state);
  if (letter) classes.push("filled");

  return <div className={classes.join(" ")}>{letter}</div>;
}
