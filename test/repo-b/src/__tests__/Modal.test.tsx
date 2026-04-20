import { Modal } from "../components/Modal/Modal";

describe("Modal", () => {
  it("should not render when closed", () => {
    const result = Modal({ isOpen: false, onClose: jest.fn(), children: "content" });
    expect(result).toBeNull();
  });

  it("should render when open", () => {
    const result = Modal({ isOpen: true, onClose: jest.fn(), children: "content" });
    expect(result).toBeDefined();
  });

  it("should call onClose when backdrop clicked", () => {
    const onClose = jest.fn();
    const modal = Modal({ isOpen: true, onClose, children: "content" });
    modal.props.onClick();
    expect(onClose).toHaveBeenCalled();
  });

  it("should not close on content click", () => {
    const onClose = jest.fn();
    const modal = Modal({ isOpen: true, onClose, children: "content" });
    const content = modal.children[0];
    content.props.onClick({ stopPropagation: jest.fn() });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should support custom title", () => {
    const modal = Modal({ isOpen: true, onClose: jest.fn(), title: "My Modal", children: "body" });
    expect(modal.props.title).toBe("My Modal");
  });

  it("should close on escape key", () => {
    const onClose = jest.fn();
    Modal({ isOpen: true, onClose, closeOnEscape: true, children: "content" });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalled();
  });
});
