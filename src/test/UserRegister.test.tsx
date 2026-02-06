import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserRegister from '@/pages/UserRegister';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/services/api', () => ({
  authAPI: {
    register: vi.fn(),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UserRegister Password Validation', () => {
  it('should show error for weak password (no uppercase)', async () => {
    renderWithRouter(<UserRegister />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('user@example.com');
    const passwordInput = screen.getByPlaceholderText(/min 8 chars/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123!' } }); // No uppercase

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      );
    });
  });

  it('should show error for weak password (no lowercase)', async () => {
    renderWithRouter(<UserRegister />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('user@example.com');
    const passwordInput = screen.getByPlaceholderText(/min 8 chars/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'PASSWORD123!' } }); // No lowercase

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      );
    });
  });

  it('should show error for weak password (no number)', async () => {
    renderWithRouter(<UserRegister />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('user@example.com');
    const passwordInput = screen.getByPlaceholderText(/min 8 chars/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password!' } }); // No number

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      );
    });
  });

  it('should show error for weak password (no special character)', async () => {
    renderWithRouter(<UserRegister />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('user@example.com');
    const passwordInput = screen.getByPlaceholderText(/min 8 chars/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } }); // No special char

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      );
    });
  });

  it('should show error for weak password (too short)', async () => {
    renderWithRouter(<UserRegister />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('user@example.com');
    const passwordInput = screen.getByPlaceholderText(/min 8 chars/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Pass1!' } }); // Only 6 chars

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      );
    });
  });

  it('should show error for weak password (contains spaces)', async () => {
    renderWithRouter(<UserRegister />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('user@example.com');
    const passwordInput = screen.getByPlaceholderText(/min 8 chars/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Pass word123!' } }); // Contains space

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      );
    });
  });

  it('should display password requirements helper text', () => {
    renderWithRouter(<UserRegister />);

    const helperText = screen.getByText(/Must include: uppercase, lowercase, number, special character/i);
    expect(helperText).toBeInTheDocument();
  });
});
