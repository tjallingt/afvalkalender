import { z } from 'zod';

const API_BASE_URL = 'https://wasteapi.ximmio.com/api';
const COMPANY_CODE = '8d97bb56-5afd-4cbc-a651-b4f7314264b4';

const ApiResponse = z.object({
	userMessage: z.object({
		type: z.unknown().nullable(),
		messageCode: z.number(),
		description: z.unknown().nullable(),
	}),
	ExtraOption: z.object({
		$type: z.string(),
	}),
	dataList: z.array(z.unknown()),
	intDataList: z.unknown().nullable(),
	data: z.unknown().nullable(),
	status: z.boolean(),
	messageCode: z.number(),
	pdfResponse: z.unknown().nullable(),
	token: z.unknown().nullable(),
	ID: z.unknown().nullable(),
	invalidParameters: z.unknown().nullable(),
	total: z.number(),
	messageToString: z.unknown().nullable(),
});

const Address = z.object({
	AddressDetail: z.unknown().nullable(),
	AddressProp: z.unknown().nullable(),
	AddressType: z.string(),
	AddressUnique: z.string(), // "XXXXXXXXXX"
	AddressUniqueId: z.number(),
	BuildingCategory: z.unknown().nullable(),
	City: z.string(), // "Enschede"
	CommercialNumber: z.unknown().nullable(),
	Community: z.string(), // "Enschede"
	FeatureFlagJson: z.unknown().nullable(),
	Floor: z.unknown().nullable(),
	HouseLetter: z.string(), // "A" or " "
	HouseNumber: z.string(), // "X"
	HouseNumberAddition: z.string(), // " "
	HouseNumberIndication: z.string(), // " "
	ID: z.number(),
	Latitude: z.unknown().nullable(),
	LocationName: z.unknown().nullable(),
	Longitude: z.unknown().nullable(),
	Plaatsnaam: z.unknown().nullable(),
	PostCode: z.unknown().nullable(),
	RegistrationMethodsJson: z.unknown().nullable(),
	RelativeName: z.unknown().nullable(),
	Street: z.string(), // "XXXXXXstraat"
	UniqueId: z.string(), // "XXXXXXXXXX"
	ZipCode: z.string(), // "XXXXXX"
	useExactAddress: z.boolean(),
});

export type Address = z.infer<typeof Address>;

export async function fetchAddresses(
	// post code in the form of "XXXXXX"
	postCode: string,
	// house number for example "X"
	houseNumber: string,
	// house letter for example "A"
	// use " " to mean, no house number
	houseLetter: string
): Promise<Array<Address>> {
	let response = await fetch(`${API_BASE_URL}/FetchAdress`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json;charset=UTF-8',
		},
		body: JSON.stringify({
			companyCode: COMPANY_CODE,
			postCode,
			houseNumber,
			houseLetter,
		}),
	});

	let results: unknown = await response.json();
	let data = ApiResponse.parse(results);
	return z.array(Address).parse(data.dataList);
}

function formatDate(date: Date): string {
	// format date as iso string, for example "2011-10-05T14:48:00.000Z"
	// then only take the "2011-10-05" for a format like "%Y-%m-%d"
	// TODO: test what kind of date formats are supported by the API
	return date.toISOString(); // .split("T")[0];
}

const Pickup = z.object({
	pickupDates: z.array(z.string().pipe(z.coerce.date())), // ["2024-03-05T00:00:00"]
	pickupType: z.number(),
	_pickupType: z.number(),
	_pickupTypeText: z.enum([
		'BRANCHES',
		'BULKLITTER',
		'BULKYGARDENWASTE',
		'GLASS',
		'GREENGREY',
		'GREEN',
		'GREY',
		'KCA',
		'PACKAGES',
		'PAPER',
		'PLASTIC',
		'REMAINDER',
		'TEXTILE',
		'TREE',
	]),
	description: z.unknown().nullable(),
});

export type Pickup = z.infer<typeof Pickup>;

export async function fetchPickups(
	// unique address id in the form of "XXXXXXXXXX"
	addressId: string,
	startDate: Date,
	endDate: Date
): Promise<Array<Pickup>> {
	let response = await fetch(`${API_BASE_URL}/GetCalendar`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json;charset=UTF-8',
		},
		body: JSON.stringify({
			companyCode: COMPANY_CODE,
			uniqueAddressID: addressId,
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
			// community
		}),
	});

	let results: unknown = await response.json();
	let data = ApiResponse.parse(results);
	return z.array(Pickup).parse(data.dataList);
}
