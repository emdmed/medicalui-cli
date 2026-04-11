"use client";

import React, { Component, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-4">
          <CardContent className="flex flex-col items-center gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              {this.props.fallbackMessage ||
                "Something went wrong loading this section."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
