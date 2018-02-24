/// <reference path="../References.d.ts"/>
import * as React from 'react';
import * as DiskTypes from '../types/DiskTypes';
import * as OrganizationTypes from '../types/OrganizationTypes';
import DisksStore from '../stores/DisksStore';
import OrganizationsStore from '../stores/OrganizationsStore';
import * as DiskActions from '../actions/DiskActions';
import * as OrganizationActions from '../actions/OrganizationActions';
import Disk from './Disk';
import DisksPage from './DisksPage';
import DiskNew from './DiskNew';
import Page from './Page';
import PageHeader from './PageHeader';
import NonState from './NonState';
import ConfirmButton from './ConfirmButton';
import ZonesStore from "../stores/ZonesStore";
import DatacentersStore from "../stores/DatacentersStore";
import * as ZoneTypes from "../types/ZoneTypes";
import * as DatacenterTypes from "../types/DatacenterTypes";
import NodesStore from "../stores/NodesStore";
import InstancesStore from "../stores/InstancesStore";
import * as InstanceActions from "../actions/InstanceActions";
import * as DatacenterActions from "../actions/DatacenterActions";
import * as ZoneActions from "../actions/ZoneActions";
import * as NodeActions from "../actions/NodeActions";

interface Selected {
	[key: string]: boolean;
}

interface Opened {
	[key: string]: boolean;
}

interface State {
	disks: DiskTypes.DisksRo;
	organizations: OrganizationTypes.OrganizationsRo;
	datacenters: DatacenterTypes.DatacentersRo;
	zones: ZoneTypes.ZonesRo;
	selected: Selected;
	opened: Opened;
	newOpened: boolean;
	lastSelected: string;
	disabled: boolean;
}

const css = {
	items: {
		width: '100%',
		marginTop: '-5px',
		display: 'table',
		borderSpacing: '0 5px',
	} as React.CSSProperties,
	itemsBox: {
		width: '100%',
		overflowY: 'auto',
	} as React.CSSProperties,
	placeholder: {
		opacity: 0,
		width: '100%',
	} as React.CSSProperties,
	header: {
		marginTop: '-19px',
	} as React.CSSProperties,
	heading: {
		margin: '19px 0 0 0',
	} as React.CSSProperties,
	button: {
		margin: '10px 0 0 10px',
	} as React.CSSProperties,
};

export default class Disks extends React.Component<{}, State> {
	constructor(props: any, context: any) {
		super(props, context);
		this.state = {
			disks: DisksStore.disks,
			organizations: OrganizationsStore.organizations,
			datacenters: DatacentersStore.datacenters,
			zones: ZonesStore.zones,
			selected: {},
			opened: {},
			newOpened: false,
			lastSelected: null,
			disabled: false,
		};
	}

	get selected(): boolean {
		return !!Object.keys(this.state.selected).length;
	}

	get opened(): boolean {
		return !!Object.keys(this.state.opened).length;
	}

	componentDidMount(): void {
		InstancesStore.addChangeListener(this.onChange);
		DisksStore.addChangeListener(this.onChange);
		OrganizationsStore.addChangeListener(this.onChange);
		DatacentersStore.addChangeListener(this.onChange);
		NodesStore.addChangeListener(this.onChange);
		InstanceActions.sync();
		DiskActions.sync();
		OrganizationActions.sync();
		DatacenterActions.sync();
		NodeActions.sync();
		ZoneActions.sync();
	}

	componentWillUnmount(): void {
		InstancesStore.removeChangeListener(this.onChange);
		DisksStore.removeChangeListener(this.onChange);
		OrganizationsStore.removeChangeListener(this.onChange);
		DatacentersStore.removeChangeListener(this.onChange);
		NodesStore.removeChangeListener(this.onChange);
		ZonesStore.removeChangeListener(this.onChange);
	}

	onChange = (): void => {
		let disks = DisksStore.disks;
		let selected: Selected = {};
		let curSelected = this.state.selected;
		let opened: Opened = {};
		let curOpened = this.state.opened;

		disks.forEach((disk: DiskTypes.Disk): void => {
			if (curSelected[disk.id]) {
				selected[disk.id] = true;
			}
			if (curOpened[disk.id]) {
				opened[disk.id] = true;
			}
		});

		this.setState({
			...this.state,
			disks: disks,
			organizations: OrganizationsStore.organizations,
			datacenters: DatacentersStore.datacenters,
			zones: ZonesStore.zones,
			selected: selected,
			opened: opened,
		});
	}

	onDelete = (): void => {
		this.setState({
			...this.state,
			disabled: true,
		});
		DiskActions.removeMulti(
			Object.keys(this.state.selected)).then((): void => {
			this.setState({
				...this.state,
				selected: {},
				disabled: false,
			});
		}).catch((): void => {
			this.setState({
				...this.state,
				disabled: false,
			});
		});
	}

	onSnapshot = (): void => {
		this.setState({
			...this.state,
			disabled: true,
		});
		DiskActions.updateMulti(
			Object.keys(this.state.selected), 'snapshot').then((): void => {
			this.setState({
				...this.state,
				selected: {},
				disabled: false,
			});
		}).catch((): void => {
			this.setState({
				...this.state,
				disabled: false,
			});
		});
	}

	render(): JSX.Element {
		let disksDom: JSX.Element[] = [];

		this.state.disks.forEach((
			disk: DiskTypes.DiskRo): void => {
			disksDom.push(<Disk
				key={disk.id}
				disk={disk}
				organizations={this.state.organizations}
				selected={!!this.state.selected[disk.id]}
				open={!!this.state.opened[disk.id]}
				onSelect={(shift: boolean): void => {
					let selected = {
						...this.state.selected,
					};

					if (shift) {
						let disks = this.state.disks;
						let start: number;
						let end: number;

						for (let i = 0; i < disks.length; i++) {
							let usr = disks[i];

							if (usr.id === disk.id) {
								start = i;
							} else if (usr.id === this.state.lastSelected) {
								end = i;
							}
						}

						if (start !== undefined && end !== undefined) {
							if (start > end) {
								end = [start, start = end][0];
							}

							for (let i = start; i <= end; i++) {
								selected[disks[i].id] = true;
							}

							this.setState({
								...this.state,
								lastSelected: disk.id,
								selected: selected,
							});

							return;
						}
					}

					if (selected[disk.id]) {
						delete selected[disk.id];
					} else {
						selected[disk.id] = true;
					}

					this.setState({
						...this.state,
						lastSelected: disk.id,
						selected: selected,
					});
				}}
				onOpen={(): void => {
					let opened = {
						...this.state.opened,
					};

					if (opened[disk.id]) {
						delete opened[disk.id];
					} else {
						opened[disk.id] = true;
					}

					this.setState({
						...this.state,
						opened: opened,
					});
				}}
			/>);
		});

		let newDiskDom: JSX.Element;
		if (this.state.newOpened) {
			newDiskDom = <DiskNew
				organizations={this.state.organizations}
				datacenters={this.state.datacenters}
				zones={this.state.zones}
				onClose={(): void => {
					this.setState({
						...this.state,
						newOpened: false,
					});
				}}
			/>;
		}

		return <Page>
			<PageHeader>
				<div className="layout horizontal wrap" style={css.header}>
					<h2 style={css.heading}>Disks</h2>
					<div className="flex"/>
					<div>
						<button
							className="pt-button pt-intent-warning pt-icon-chevron-up"
							style={css.button}
							disabled={!this.opened}
							type="button"
							onClick={(): void => {
								this.setState({
									...this.state,
									opened: {},
								});
							}}
						>
							Collapse All
						</button>
						<ConfirmButton
							label="Snapshot Selected"
							className="pt-intent-primary pt-icon-floppy-disk"
							progressClassName="pt-intent-primary"
							style={css.button}
							disabled={!this.selected || this.state.disabled}
							onConfirm={this.onSnapshot}
						/>
						<ConfirmButton
							label="Delete Selected"
							className="pt-intent-danger pt-icon-delete"
							progressClassName="pt-intent-danger"
							style={css.button}
							disabled={!this.selected || this.state.disabled}
							onConfirm={this.onDelete}
						/>
						<button
							className="pt-button pt-intent-success pt-icon-add"
							style={css.button}
							disabled={this.state.disabled || this.state.newOpened}
							type="button"
							onClick={(): void => {
								this.setState({
									...this.state,
									newOpened: true,
								});
							}}
						>New</button>
					</div>
				</div>
			</PageHeader>
			<div style={css.itemsBox}>
				<div style={css.items}>
					{newDiskDom}
					{disksDom}
					<tr className="pt-card pt-row" style={css.placeholder}>
						<td colSpan={5} style={css.placeholder}/>
					</tr>
				</div>
			</div>
			<NonState
				hidden={!!disksDom.length}
				iconClass="pt-icon-key"
				title="No disks"
				description="Add a new disk to get started."
			/>
			<DisksPage
				onPage={(): void => {
					this.setState({
						lastSelected: null,
					});
				}}
			/>
		</Page>;
	}
}
