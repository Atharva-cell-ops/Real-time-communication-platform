import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';

describe('Frontend Common Components', () => {
  describe('Button Component', () => {
    it('should render children and respond to clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled or loading prop is passed', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button', { name: /disabled button/i });
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Input Component', () => {
    it('should render label, input, and update value on change', () => {
      render(<Input label="Meeting Name" placeholder="Enter title" />);

      const input = screen.getByPlaceholderText('Enter title');
      expect(input).toBeInTheDocument();
      expect(screen.getByText('Meeting Name')).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'Standup' } });
      expect((input as HTMLInputElement).value).toBe('Standup');
    });

    it('should render error message when error prop is present', () => {
      render(<Input label="Passcode" error="Passcode is required" />);
      expect(screen.getByText('Passcode is required')).toBeInTheDocument();
    });
  });

  describe('Badge Component', () => {
    it('should render badge with appropriate content', () => {
      render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
});
