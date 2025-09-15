import Decimal from 'decimal.js';
import { format } from 'numerable';

export const dec = (input: string | number | Decimal): Decimal => new Decimal(input);

export const usdFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD'
});

export const fValue = (n: Decimal, { price }: { price?: boolean } = { price: true }): string => {
	const defaultFormat = `${price ? '$' : ''}0,0.XX`;
	const zeroFormat = format(n.toNumber(), defaultFormat, { currency: 'USD' });

	const minSignificantDigits = 2;

	let result = '';

	if (n.eq(dec(0))) {
		result = zeroFormat;
	} else {
		const abs = n.abs();

		// Decide how many decimal places to show based on magnitude
		const integerDigits = Decimal.log10(abs).floor().toNumber() + 1;

		// For numbers with 2 or more integer digits, no need for decimals
		if (integerDigits >= minSignificantDigits) {
			// If number already has 2 sig digits in integer part, just return fixed to 0 decimals
			result = format(dec(n.toFixed(minSignificantDigits)).toNumber(), defaultFormat, {
				currency: 'USD'
			});
		} else {
			// Otherwise, preserve decimal precision
			const digitsToShow = minSignificantDigits - integerDigits;
			result = format(
				n.toFixed(digitsToShow),
				`${price ? '$' : ''}0,0.${Array(digitsToShow).fill('X').join('')}`,
				{ currency: 'USD' }
			);
		}
	}
	// if (result === defaultFormat && n.abs().gt(0)) {
	// 	result = '~' + result;
	// }

	return result;
};
export const fAmount = (amount: Decimal) => fValue(amount, { price: false });

export const fPercent = (amount: Decimal) => {
	let result = format(amount.toNumber(), '0,0.00%');
	const defaultFormat = format(0, '0,0.00%');

	if (result === defaultFormat && amount.abs().gt(0)) {
		result = '~' + result;
	}

	return result;
};