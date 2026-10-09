import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
        <span className="bg-gradient-to-br from-primary to-accent bg-clip-text font-display text-[7rem] font-extrabold leading-none text-transparent">
          404
        </span>
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
        This page took a wrong turn
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/">
            <Home className="h-4 w-4" /> Back home
          </Link>
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <Compass className="h-4 w-4" /> Go back
        </Button>
      </div>
    </div>
  );
}
