import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleProps {
	isPasswordVisible: boolean;
	onToggle: () => void;
}

const PasswordToggle: React.FC<PasswordToggleProps> = ({
	isPasswordVisible,
	onToggle,
}) => (
	<button
		type="button"
		onClick={onToggle}
		className="text-gray-400 pr-5 pl-2 hover:text-gray-600 transition-colors"
	>
		{isPasswordVisible ? <EyeOff /> : <Eye />}
	</button>
);

export default PasswordToggle;
