import DS from 'ember-data';
import { Model } from 'ember-pouch';

export default Model.extend({
	list: DS.belongsTo('list'),
	fields: DS.hasMany('field', {save: true}),
	order: DS.attr(),
	format: DS.attr(),
	title: DS.attr()
});
