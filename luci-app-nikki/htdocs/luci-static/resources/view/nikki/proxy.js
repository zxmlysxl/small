'use strict';
'require form';
'require view';
'require uci';
'require network';
'require tools.widgets as widgets';
'require tools.nikki as nikki';

return view.extend({
    load: function () {
        return Promise.all([
            uci.load('nikki'),
            network.getHostHints(),
            network.getNetworks(),
            nikki.getIdentifiers(),
        ]);
    },
    render: function (data) {
        const hosts = data[1].hosts;
        const networks = data[2];
        const users = data[3]?.users ?? [];
        const groups = data[3]?.groups ?? [];
        const cgroups = data[3]?.cgroups ?? [];

        let m, s, o;

        m = new form.Map('nikki');

        s = m.section(form.NamedSection, 'proxy', 'proxy', _('Proxy Config'));

        s.tab('transparent_proxy', _('Transparent Proxy'));

        o = s.taboption('transparent_proxy', form.Flag, 'transparent_proxy', _('Enable'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.ListValue, 'tcp_transparent_proxy_mode', _('TCP Proxy Mode'));
        o.optional = true;
        o.placeholder = _('Disable');
        o.value('redirect', _('Redirect Mode'));
        o.value('tproxy', _('TPROXY Mode'));
        o.value('tun', _('TUN Mode'));

        o = s.taboption('transparent_proxy', form.ListValue, 'udp_transparent_proxy_mode', _('UDP Proxy Mode'));
        o.optional = true;
        o.placeholder = _('Disable');
        o.value('tproxy', _('TPROXY Mode'));
        o.value('tun', _('TUN Mode'));

        o = s.taboption('transparent_proxy', form.Flag, 'ipv4_dns_hijack', _('IPv4 DNS Hijack'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'ipv6_dns_hijack', _('IPv6 DNS Hijack'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'ipv4_proxy', _('IPv4 Proxy'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'ipv6_proxy', _('IPv6 Proxy'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'fake_ip_ping_hijack', _('Fake-IP Ping Hijack'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'router_proxy', _('Router Proxy'));
        o.rmempty = false;

        o = s.taboption('transparent_proxy', form.Flag, 'lan_proxy', _('Lan Proxy'));
        o.rmempty = false;

        s.tab('access_control', _('Access Control'));

        o = s.taboption('access_control', form.ListValue, 'access_control_mode', _('Mode'));
        o.value('all', _('All Mode'));
        o.value('allow', _('Allow Mode'));
        o.value('block', _('Block Mode'));

        o = s.taboption('access_control', form.DynamicList, 'acl_ip', 'IP');
        o.datatype = 'ipmask4';
        o.retain = true;
        o.depends('access_control_mode', 'allow');
        o.depends('access_control_mode', 'block');

        for (const mac in hosts) {
            const host = hosts[mac];
            for (const ip of host.ipaddrs) {
                const hint = host.name ?? mac;
                o.value(ip, hint ? '%s (%s)'.format(ip, hint) : ip);
            };
        };

        o = s.taboption('access_control', form.DynamicList, 'acl_ip6', 'IP6');
        o.datatype = 'ipmask6';
        o.retain = true;
        o.depends('access_control_mode', 'allow');
        o.depends('access_control_mode', 'block');

        for (const mac in hosts) {
            const host = hosts[mac];
            for (const ip of host.ip6addrs) {
                const hint = host.name ?? mac;
                o.value(ip, hint ? '%s (%s)'.format(ip, hint) : ip);
            };
        };

        o = s.taboption('access_control', form.DynamicList, 'acl_mac', 'MAC');
        o.datatype = 'macaddr';
        o.retain = true;
        o.depends('access_control_mode', 'allow');
        o.depends('access_control_mode', 'block');

        for (const mac in hosts) {
            const host = hosts[mac];
            const hint = host.name ?? host.ipaddrs[0];
            o.value(mac, hint ? '%s (%s)'.format(mac, hint) : mac);
        };

        o = s.taboption('access_control', form.DynamicList, 'acl_interface', _('Interface'));
        o.multiple = true;
        o.optional = true;
        o.retain = true;
        o.depends('access_control_mode', 'allow');
        o.depends('access_control_mode', 'block');

        for (const network of networks) {
            if (network.getName() === 'loopback') {
                continue;
            }
            o.value(network.getName());
        }

        s.tab('bypass', _('Bypass'));

        o = s.taboption('bypass', form.DynamicList, 'bypass_user', _('Bypass User'));

        for (const user of users) {
            o.value(user);
        };

        o = s.taboption('bypass', form.DynamicList, 'bypass_group', _('Bypass Group'));

        for (const group of groups) {
            o.value(group);
        };

        o = s.taboption('bypass', form.DynamicList, 'bypass_cgroup', _('Bypass cgroup'));

        for (const cgroup of cgroups) {
            o.value(cgroup);
        };

        o = s.taboption('bypass', form.Flag, 'bypass_china_mainland_ip', _('Bypass China Mainland IP'));
        o.rmempty = false;

        o = s.taboption('bypass', form.Value, 'proxy_tcp_dport', _('Destination TCP Port to Proxy'));
        o.rmempty = false;
        o.value('0-65535', _('All Port'));
        o.value('21 22 80 110 143 194 443 465 853 993 995 8080 8443', _('Commonly Used Port'));

        o = s.taboption('bypass', form.Value, 'proxy_udp_dport', _('Destination UDP Port to Proxy'));
        o.rmempty = false;
        o.value('0-65535', _('All Port'));
        o.value('123 443 8443', _('Commonly Used Port'));

        o = s.taboption('bypass', form.DynamicList, 'bypass_dscp', _('Bypass DSCP'));
        o.datatype = 'range(0, 63)';

        return m.render();
    }
});
