import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

describe("ToggleSwitch Component", () => {
  const defaultProps = {
    checked: false,
    onCheckedChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render as a switch button", () => {
      render(<ToggleSwitch {...defaultProps} />);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should render with label when provided", () => {
      render(<ToggleSwitch {...defaultProps} label="Enable feature" />);
      expect(screen.getByText("Enable feature")).toBeInTheDocument();
    });

    it("should render with description when provided", () => {
      render(
        <ToggleSwitch
          {...defaultProps}
          label="Feature"
          description="This enables the feature"
        />
      );
      expect(screen.getByText("This enables the feature")).toBeInTheDocument();
    });

    it("should render without wrapper when no label/description", () => {
      const { container } = render(<ToggleSwitch {...defaultProps} />);
      expect(container.querySelector("button")).toBeInTheDocument();
      expect(container.querySelector(".flex.items-center.justify-between")).not.toBeInTheDocument();
    });
  });

  describe("Checked State", () => {
    it("should have aria-checked false when unchecked", () => {
      render(<ToggleSwitch {...defaultProps} checked={false} />);
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    });

    it("should have aria-checked true when checked", () => {
      render(<ToggleSwitch {...defaultProps} checked={true} />);
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });

    it("should apply checked styles when checked", () => {
      render(<ToggleSwitch {...defaultProps} checked={true} />);
      expect(screen.getByRole("switch")).toHaveClass("bg-violet-500");
    });

    it("should apply unchecked styles when not checked", () => {
      render(<ToggleSwitch {...defaultProps} checked={false} />);
      expect(screen.getByRole("switch")).toHaveClass("bg-[var(--bg-hover)]");
    });
  });

  describe("Sizes", () => {
    it("should render sm size", () => {
      render(<ToggleSwitch {...defaultProps} size="sm" />);
      expect(screen.getByRole("switch")).toHaveClass("w-10");
      expect(screen.getByRole("switch")).toHaveClass("h-5");
    });

    it("should render md size (default)", () => {
      render(<ToggleSwitch {...defaultProps} />);
      expect(screen.getByRole("switch")).toHaveClass("w-14");
      expect(screen.getByRole("switch")).toHaveClass("h-7");
    });

    it("should render lg size", () => {
      render(<ToggleSwitch {...defaultProps} size="lg" />);
      expect(screen.getByRole("switch")).toHaveClass("w-16");
      expect(screen.getByRole("switch")).toHaveClass("h-8");
    });
  });

  describe("Interactions", () => {
    it("should call onCheckedChange when clicked", () => {
      const onCheckedChange = vi.fn();
      render(
        <ToggleSwitch {...defaultProps} onCheckedChange={onCheckedChange} />
      );

      fireEvent.click(screen.getByRole("switch"));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("should toggle from checked to unchecked", () => {
      const onCheckedChange = vi.fn();
      render(
        <ToggleSwitch
          {...defaultProps}
          checked={true}
          onCheckedChange={onCheckedChange}
        />
      );

      fireEvent.click(screen.getByRole("switch"));
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it("should not call onCheckedChange when disabled", () => {
      const onCheckedChange = vi.fn();
      render(
        <ToggleSwitch
          {...defaultProps}
          disabled
          onCheckedChange={onCheckedChange}
        />
      );

      fireEvent.click(screen.getByRole("switch"));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<ToggleSwitch {...defaultProps} disabled />);
      expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("should have disabled styles", () => {
      render(<ToggleSwitch {...defaultProps} disabled />);
      expect(screen.getByRole("switch")).toHaveClass("opacity-50");
      expect(screen.getByRole("switch")).toHaveClass("cursor-not-allowed");
    });
  });

  describe("Accessibility", () => {
    it("should have switch role", () => {
      render(<ToggleSwitch {...defaultProps} />);
      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should have aria-label when label provided", () => {
      render(<ToggleSwitch {...defaultProps} label="Toggle feature" />);
      expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "Toggle feature");
    });

    it("should be focusable", () => {
      render(<ToggleSwitch {...defaultProps} />);
      const toggle = screen.getByRole("switch");
      toggle.focus();
      expect(toggle).toHaveFocus();
    });

    it("should have type button to prevent form submission", () => {
      render(<ToggleSwitch {...defaultProps} />);
      expect(screen.getByRole("switch")).toHaveAttribute("type", "button");
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      render(<ToggleSwitch {...defaultProps} className="custom-toggle" />);
      expect(screen.getByRole("switch")).toHaveClass("custom-toggle");
    });
  });

  describe("Thumb Animation", () => {
    it("should have thumb element", () => {
      const { container } = render(<ToggleSwitch {...defaultProps} />);
      const thumb = container.querySelector("span");
      expect(thumb).toBeInTheDocument();
      expect(thumb).toHaveClass("rounded-full");
      expect(thumb).toHaveClass("bg-white");
    });

    it("should translate thumb when checked", () => {
      const { container } = render(
        <ToggleSwitch {...defaultProps} checked={true} />
      );
      const thumb = container.querySelector("span");
      expect(thumb).toHaveClass("translate-x-[26px]");
    });

    it("should not translate thumb when unchecked", () => {
      const { container } = render(
        <ToggleSwitch {...defaultProps} checked={false} />
      );
      const thumb = container.querySelector("span");
      expect(thumb).toHaveClass("translate-x-0");
    });
  });
});
