'use client'

import { UserButton as ClerkUserButton } from "@clerk/nextjs";
import { Dropdown, Button } from "react-bootstrap";

export default function UserButton() {
  return (
    <div className="d-inline-block">
      <ClerkUserButton 
        appearance={{
          elements: {
            userButtonAvatarBox: "rounded-circle",
            userButtonTrigger: "btn btn-outline-light"
          }
        }}
      />
    </div>
  );
}
