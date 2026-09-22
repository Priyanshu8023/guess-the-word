"use client";

interface TileProps {
  letter: string;
  state: "empty" | "filled" | "green" | "orange" | "grey" | "active";
}

const stateClassMap: Record<string, string> = {
  filled: "tile--filled",
  green: "tile--correct",
  orange: "tile--present",
  grey: "tile--absent",
  active: "tile--filled",
};

export default function Tile({ letter, state }: TileProps) {
  const cls = ["tile"];
  if (state !== "empty" && stateClassMap[state]) {
    cls.push(stateClassMap[state]);
  }
  return <div className={cls.join(" ")}>{letter}</div>;
}
