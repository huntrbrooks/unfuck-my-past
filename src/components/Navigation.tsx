'use client'

import { useAuth } from "@clerk/nextjs";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import UserButton from "./UserButton";
import Link from "next/link";

export default function Navigation() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="py-3">
      <Container>
        <Navbar.Brand as={Link} href="/" className="fw-bold">
          Unfuck Your Past
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} href="/how-it-works">How It Works</Nav.Link>
            {isSignedIn && (
              <>
                <Nav.Link as={Link} href="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} href="/program">30-Day Program</Nav.Link>
                <Nav.Link as={Link} href="/onboarding">Continue Journey</Nav.Link>
              </>
            )}
          </Nav>
          
          <Nav className="ms-auto">
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <UserButton />
                ) : (
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-light" 
                      as={Link as any} 
                      href="/sign-in"
                      size="sm"
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="primary" 
                      as={Link as any} 
                      href="/sign-up"
                      size="sm"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
