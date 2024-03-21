import { fetchAddresses, fetchPickups, Pickup } from './ximmio_api';
import { ICalEvent, createICal } from './ical';

// references
// - https://github.com/pippyn/Home-Assistant-Sensor-Afvalbeheer
// - https://github.com/xirixiz/homeassistant-afvalwijzer
// - https://github.com/Timendus/afvalkalender

export interface Env {}

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
		const { searchParams } = new URL(request.url);

		let postCode = searchParams.get('postCode');
		if (postCode == null) {
			return new Response('missing url query parameter `postCode`', {
				status: 400,
			});
		}

		let houseNumber = searchParams.get('houseNumber');
		if (houseNumber == null) {
			return new Response('missing url query parameter `houseNumber`', {
				status: 400,
			});
		}

		let houseLetter = searchParams.get('houseLetter') ?? ' ';

		let addresses = await fetchAddresses(postCode, houseNumber, houseLetter);

		if (addresses.length == 0) {
			return new Response('did not find any address matching the `postCode`, `houseNumber` and `houseLetter`', {
				status: 404,
			});
		}

		if (addresses.length > 1) {
			return new Response('found multiple addresses matching the `postCode`, `houseNumber` and `houseLetter`', {
				status: 400,
			});
		}

		let address = addresses[0];
		let now = new Date();

		// fetch pickup dates for the past week as well to prevent calendar events from disappearing too soon
		let startDate = subtractDays(now, 7);
		// fetch pickup dates for a whole year in advance
		let endDate = addYears(now, 1);

		let pickups = await fetchPickups(address.UniqueId, startDate, endDate);

		let events = convertPickupsToICalEvents(pickups);

		let ical = createICal('TwenteMilieu/Afvalkalender', events);

		return new Response(ical, {
			headers: {
				'content-type': 'text/calendar',
			},
		});
	},
};

function addYears(date: Date, numYears: number): Date {
	let new_date = new Date(date.getTime());
	new_date.setFullYear(new_date.getFullYear() + numYears);
	return new_date;
}

function addDays(date: Date, numDays: number): Date {
	let new_date = new Date(date.getTime());
	new_date.setDate(new_date.getDate() + numDays);
	return new_date;
}

function subtractDays(date: Date, numDays: number): Date {
	return addDays(date, -numDays);
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
				endDate: addDays(pickupDate, 1),
				summary: description,
			};

			result.push(event);
		}
	}

	return result;
}
