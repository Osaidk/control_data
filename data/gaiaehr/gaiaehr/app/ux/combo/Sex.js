Ext.define('App.ux.combo.Sex', {
	extend       : 'Ext.form.ComboBox',
	alias        : 'widget.gaiaehr.sexcombo',
	initComponent: function() {
		var me = this;

		Ext.define('Sexmodel', {
			extend: 'Ext.data.Model',
			fields: [
				{name: 'option_name', type: 'string' },
				{name: 'option_value', type: 'string' }
			],
			proxy : {
				type       : 'direct',
				api        : {
					read: CombosData.getOptionsByListId
				},
				extraParams: {
					list_id: 19
				}
			}
		});

		me.store = Ext.create('Ext.data.Store', {
			model   : 'Sexmodel',
			autoLoad: true
		});

		Ext.apply(this, {
			editable    : false,
			queryMode   : 'local',
			displayField: 'option_name',
			valueField  : 'option_value',
			emptyText   : _('select'),
			store       : me.store
		}, null);
		me.callParent(arguments);
	}
});