'use client'

import React, { useState } from 'react'
import { Navbar, Nav, Container, Button, Offcanvas } from 'react-bootstrap'
import { useAuth } from '@clerk/nextjs'
import UserButton from './UserButton'
import ThemeToggle from './ThemeToggle'
import Link from 'next/link'

interface MobileMenuProps {
  className?: string
}

export default function MobileMenu({ className = '' }: MobileMenuProps) {
  const [show, setShow] = useState(false)
  const { isSignedIn, isLoaded } = useAuth()

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <>
      <Navbar 
        bg="dark" 
        variant="dark" 
        expand="lg" 
        className={`mobile-navbar ${className}`}
        fixed="top"
      >
        <Container fluid>
          <Navbar.Brand as={Link} href="/" className="fw-bold">
            Unfuck Your Past
          </Navbar.Brand>
          
          <div className="d-flex align-items-center">
            <ThemeToggle variant="ghost" size="sm" className="me-2" />
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleShow}
              className="mobile-menu-toggle"
            >
              <span className="navbar-toggler-icon"></span>
            </Button>
          </div>
        </Container>
      </Navbar>

      <Offcanvas 
        show={show} 
        onHide={handleClose} 
        placement="end"
        className="mobile-offcanvas"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link as={Link} href="/how-it-works" onClick={handleClose}>
              How It Works
            </Nav.Link>
            
            {isSignedIn && (
              <>
                <Nav.Link as={Link} href="/dashboard" onClick={handleClose}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} href="/program" onClick={handleClose}>
                  30-Day Program
                </Nav.Link>
                <Nav.Link as={Link} href="/onboarding" onClick={handleClose}>
                  Continue Journey
                </Nav.Link>
              </>
            )}
          </Nav>
          
          <hr className="my-4" />
          
          {isLoaded && (
            <div className="d-grid gap-2">
              {isSignedIn ? (
                <div className="text-center">
                  <UserButton />
                </div>
              ) : (
                <>
                  <Button 
                    variant="outline-primary" 
                    as={Link as any} 
                    href="/sign-in"
                    size="lg"
                    onClick={handleClose}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="primary" 
                    as={Link as any} 
                    href="/sign-up"
                    size="lg"
                    onClick={handleClose}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )
}
