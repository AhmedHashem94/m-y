import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
	selector: '[hlmCardDescription],hlm-card-description',
	host: {
		'data-slot': 'card-description',
	},
})
export class HlmCardDescription {
	constructor() {
		classes(() => 'text-muted-foreground text-sm');
	}
}
