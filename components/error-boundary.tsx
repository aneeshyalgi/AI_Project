"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="w-full max-w-md mx-auto mt-8 border-red-200">
          <CardHeader className="bg-red-50 text-red-800">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                An error occurred while rendering this component. You can try reloading the page or resetting the
                component.
              </p>
              {this.state.error && (
                <div className="p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={this.handleReset}>
              Reset
            </Button>
            <Button onClick={this.handleReload}>Reload Page</Button>
          </CardFooter>
        </Card>
      )
    }

    return this.props.children
  }
}
