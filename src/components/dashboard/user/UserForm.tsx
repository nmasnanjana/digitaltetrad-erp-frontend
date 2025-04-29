'use client';

import React, { useState } from 'react';
import { Role, User } from '@/types/user';

interface Props {
  onSubmit: (data: any) => void;
  initialData?: Partial<User>;
}

const UserForm: React.FC<Props> = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    username: initialData.username || '',
    email: initialData.email || '',
    role: initialData.role || 'user',
    password: '',
    password_confirmation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(formData); }}>
      <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
      <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
      <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
      <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
      <select name="role" value={formData.role} onChange={handleChange}>
        {['admin', 'user', 'viewer', 'developer'].map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      <input name="password_confirmation" type="password" placeholder="Confirm Password" onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
};

export default UserForm;
