import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { authService } from '../../services/auth/authService';
import { registerSchema } from '../../schemas/authSchemas';
import { RegisterInput } from '../../types/auth';

export function useRegister() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = form.handleSubmit(async (data: RegisterInput) => {
    setIsSuccess(false);
    try {
      const payload = {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      };
      
      const response = await authService.register(payload);
      if (response.success) {
        setIsSuccess(true);
      } else {
        setServerError('Có lỗi xảy ra khi đăng ký. Email có thể đã tồn tại.');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký. Email có thể đã tồn tại.';
      setServerError(message);
    }
  });

  return {
    form,
    serverError,
    isSuccess,
    onSubmit,
  };
}
