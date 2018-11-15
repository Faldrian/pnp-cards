import DS from 'ember-data';
import { Model } from 'ember-pouch';

export default Model.extend({
	format: DS.attr(),
	fields: DS.hasMany('field')
});
