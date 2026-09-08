import { LoaderCircle } from "lucide-react";

type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({
  className = "size-4",
}: LoadingSpinnerProps) {
  return (
    <LoaderCircle
      className={`${className} shrink-0 animate-spin`}
      aria-hidden="true"
    />
  );
}
