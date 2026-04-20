import { Button } from "../components/Button/Button";

describe("Button", () => {
  it("should render with default props", () => {
    const result = Button({ children: "Click me" });
    expect(result).toBeDefined();
  });

  it("should apply variant classes", () => {
    const primary = Button({ children: "Primary", variant: "primary" });
    const secondary = Button({ children: "Secondary", variant: "secondary" });
    expect(primary).not.toEqual(secondary);
  });

  it("should handle disabled state", () => {
    const btn = Button({ children: "Disabled", disabled: true });
    expect(btn.props.disabled).toBe(true);
  });

  it("should call onClick handler", () => {
    const onClick = jest.fn();
    const btn = Button({ children: "Click", onClick });
    btn.props.onClick();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should support size variants", () => {
    const small = Button({ children: "S", size: "sm" });
    const large = Button({ children: "L", size: "lg" });
    expect(small.props.className).toContain("sm");
    expect(large.props.className).toContain("lg");
  });

  it("should render loading state", () => {
    const btn = Button({ children: "Loading", loading: true });
    expect(btn.props.className).toContain("loading");
  });
});
