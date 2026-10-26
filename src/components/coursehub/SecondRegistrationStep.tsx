import { useState } from 'react';

import { Fragment } from 'react/jsx-runtime';

import FormSelector from '../common/FormSelector';

function SecondRegistrationStep() {
	const [formData, setFormData] = useState({
		language: '',
	});

	const handleSelectChange = (
		field: keyof typeof formData,
		newValue: string
	) => {
		setFormData(prev => ({ ...prev, [field]: newValue }));
	};

	const languageOptions = [
		{
			value: 'english',
			label: 'English (No Audio)',
		},
		{
			value: 'igbo',
			label: 'Igbo (With Audio)',
		},
		{
			value: 'pidgin',
			label: 'Pidgin (With Audio)',
		},
	];

	return (
		<Fragment>
			<div className="mt-20 ">
				<h1 className="font-semibold text-3xl font-jakarta">
					Choose Your Language
				</h1>
				<p className="text-gray-500 font-jakarta mt-4">
					Your can changer this anytime
				</p>
			</div>
			<form className="mt-8 space-y-8 b ">
				<FormSelector
					label="Language (3 supported)"
					value={formData.language}
					onChange={value => handleSelectChange('language', value)}
					options={languageOptions}
					placeholder="e.g. Purchase Invertory"
					searchable={false}
					required
				/>
			</form>
		</Fragment>
	);
}

export default SecondRegistrationStep;
