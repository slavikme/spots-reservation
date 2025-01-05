import { fireEvent, render, screen } from "../../utils/test-utils";
import UserMenu from "../UserMenu";

describe("UserMenu", () => {
  describe("authenticated state", () => {
    it("renders user menu button with user avatar", () => {
      render(<UserMenu />);
      const menuButton = screen.getByRole("button");
      const avatar = screen.getByRole("img");
      expect(menuButton).toBeInTheDocument();
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute("src", "https://example.com/picture.jpg");
    });

    it("opens menu on click showing user info and logout", () => {
      render(<UserMenu />);
      const menuButton = screen.getByRole("button");
      fireEvent.click(menuButton);

      // Make sure only user info and logout are shown
      expect(screen.getByRole("menu")).toBeInTheDocument();
      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems).toHaveLength(4);
      expect(menuItems[0]).toHaveTextContent("Test User");
      expect(menuItems[1]).toHaveTextContent("Edit Profile");
      expect(menuItems[2]).toHaveTextContent("View Settings");
      expect(menuItems[3]).toHaveTextContent("Logout");
    });
  });

  describe("unauthenticated state", () => {
    it("renders login button when not authenticated", () => {
      render(<UserMenu />, { isAuthenticated: false });
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
