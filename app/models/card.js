import DS from 'ember-data';
import { Model } from 'ember-pouch';

export default Model.extend({
	list: DS.belongsTo('list'),
	fields: DS.hasMany('field')
});
