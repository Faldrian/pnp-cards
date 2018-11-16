import DS from 'ember-data';
import { Model } from 'ember-pouch';

export default Model.extend({
	name: DS.attr(),
	fielddefs: DS.hasMany('fielddef', {save: true}),
	cards: DS.hasMany('card', {save: true})
});
