export type ICalEvent = {
	uid: string;
	creationDate: Date;
	startDate: Date;
	endDate: Date;
	summary: string;
};

function formatDateTime(date: Date): string {
	const year = date.getUTCFullYear();
	const month = pad(date.getUTCMonth() + 1);
	const day = pad(date.getUTCDate());
	const hour = pad(date.getUTCHours());
	const minute = pad(date.getUTCMinutes());
	const second = pad(date.getUTCSeconds());
	return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function pad(i: number): string {
	return i < 10 ? `0${i}` : `${i}`;
}

export function createICal(calendarId: string, events: Array<ICalEvent>): string {
	let result = createICalHeader(calendarId);

	for (const event of events) {
		result += createICalEvent(event);
	}

	result += createICalFooter();

	return result;
}

function createICalHeader(calendarId: string): string {
	return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//${calendarId}//NONSGML v1.0//EN
X-WR-CALNAME:Afvalkalender Twentemilieu
X-WR-TIMEZONE:Europe/Amsterdam
X-WR-CALDESC:Kalender feed van Tjalling Tolle
`;
}

function createICalEvent(data: ICalEvent) {
	return `BEGIN:VEVENT
UID:${data.uid}
DTSTAMP:${formatDateTime(data.creationDate)}
DTSTART;VALUE=DATE:${formatDateTime(data.startDate)}
DTEND;VALUE=DATE:${formatDateTime(data.endDate)}
SUMMARY:${data.summary}
TRANSP:TRANSPARENT
END:VEVENT
`;
}

function createICalFooter() {
	return `END:VCALENDAR`;
}
