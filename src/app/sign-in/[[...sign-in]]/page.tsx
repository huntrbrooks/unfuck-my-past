import { SignIn } from "@clerk/nextjs";
import { Container, Row, Col } from "react-bootstrap";

export default function SignInPage() {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <div className="text-center mb-4">
            <h1 className="h3">Welcome Back</h1>
            <p className="text-muted">
              Continue your healing journey where you left off
            </p>
          </div>
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "btn btn-primary w-100",
                card: "card shadow-sm",
                headerTitle: "d-none",
                headerSubtitle: "d-none",
              }
            }}
          />
        </Col>
      </Row>
    </Container>
  );
}
