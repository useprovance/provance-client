import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Language {
	code: string;
	name: string;
	flag: string;
}

interface LanguageSelectorProps {
	selectedLanguage: string;
	onLanguageChange?: (langCode: string) => void;
	className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
	selectedLanguage,
	onLanguageChange,
	className = '',
}) => {
	// Language options with flag image paths
	const languages: Language[] = [
		{ code: 'ENG', name: 'English', flag: '/icons/eng.png' },
	];

	const selectedLang = languages.find(lang => lang.code === selectedLanguage);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div
					className={`flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors ${className}`}
				>
					<img
						src={selectedLang?.flag}
						alt={`${selectedLang?.name} flag`}
						className="w-6 h-6 rounded-full object-cover"
					/>
					<span className="text-sm font-medium text-gray-700 hidden sm:block">
						{selectedLanguage}
					</span>
					<ChevronDown className="w-4 h-4 text-gray-500" />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-48 bg-white/95 backdrop-blur-md shadow-xl ring-1 ring-black/5 border-0 rounded-xl p-2"
			>
				{languages.map(language => (
					<DropdownMenuItem
						key={language.code}
						onClick={() => onLanguageChange?.(language.code)}
						className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded-lg transition-colors"
					>
						<div className="flex items-center gap-3">
							<img
								src={language.flag}
								alt={`${language.name} flag`}
								className="w-6 h-6 rounded-full object-cover"
							/>
							<div>
								<span className="text-sm font-medium text-gray-900">
									{language.name}
								</span>
								<span className="text-xs text-gray-500 ml-2">
									{language.code}
								</span>
							</div>
						</div>
						{selectedLanguage === language.code && (
							<Check className="w-4 h-4 text-blue-600" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default LanguageSelector;
