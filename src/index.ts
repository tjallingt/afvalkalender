import { fetchAddresses, fetchPickups, Pickup } from './ximmio_api';
import { ICalEvent, createICal } from './ical';

// references
// - https://github.com/pippyn/Home-Assistant-Sensor-Afvalbeheer
// - https://github.com/xirixiz/homeassistant-afvalwijzer
// - https://github.com/Timendus/afvalkalender

export interface Env {
	POST_CODE: string;
	HOUSE_NUMBER: string;
	HOUSE_LETTER: string;
}

const DESCRIPTIONS = {
	BRANCHES: 'Takken',
	BULKLITTER: 'Grofvuil',
	BULKYGARDENWASTE: 'Tuinafval',
	GLASS: 'Glas',
	GREEN: 'Groente-, fruit- en tuinafval/etensresten',
	GREENGREY: 'Duobak',
	GREY: 'Restafval',
	KCA: 'Chemisch',
	PACKAGES: 'Verpakkingen',
	PAPER: 'Papier',
	PLASTIC: 'Plastic',
	REMAINDER: 'Restwagen',
	TEXTILE: 'Textiel',
	TREE: 'Kerstbomen',
} as const;

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		let addresses = await fetchAddresses(env.POST_CODE, env.HOUSE_NUMBER, env.HOUSE_LETTER);

		if (addresses.length != 1) {
			console.log(addresses);
			throw new Error(`expected exactly one adress but got ${addresses.length}`);
		}

		let address = addresses[0];

		let pickups = await fetchPickups(address.UniqueId, new Date(), addYear(new Date(), 1));

		let events = convertPickupsToICalEvents(pickups);

		let ical = createICal('TwenteMilieu/Afvalkalender', events);

		return new Response(ical, {
			headers: {
				'content-type': 'text/calendar',
			},
		});
	},
};

function addYear(date: Date, numYears: number): Date {
	let new_date = new Date(date.getTime());
	new_date.setFullYear(new_date.getFullYear() + numYears);
	return new_date;
}

function addDay(date: Date, numDays: number): Date {
	let new_date = new Date(date.getTime());
	new_date.setDate(new_date.getDate() + numDays);
	return new_date;
}

function convertPickupsToICalEvents(pickups: Array<Pickup>): Array<ICalEvent> {
	let result = [];

	for (const pickup of pickups) {
		const pickupType = pickup._pickupTypeText;

		for (const pickupDate of pickup.pickupDates) {
			let id = `${pickupDate.toISOString()}-${pickupType}@tjallingt.com`;

			let description = DESCRIPTIONS[pickupType];

			let event: ICalEvent = {
				uid: id,
				creationDate: pickupDate,
				startDate: pickupDate,
				endDate: addDay(pickupDate, 1),
				summary: description,
			};

			result.push(event);
		}
	}

	return result;
}
