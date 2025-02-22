
## 兜底配置
```vue
<template>
    <el-collapse>
        <el-collapse-item class="backup-config-container">
            <template slot="title">兜底配置</template>
            <div class="array-item">
                <el-collapse v-for="(group, index) in backupGroups" :key="group.id">
                    <el-collapse-item>
                        <template slot="title">
                            <div class="array-item-header">
                                <div class="index-icon">{{ index + 1 }}</div>
                                <div
                                    class="delete-icon el-icon-circle-close"
                                    @click="removeBackupGroup(group.id)"
                                ></div>
                            </div>
                        </template>
                        <xx-form ref="targetForms" :model="group.target">
                            <xx-form-item label="目标组件" prop="id" :rules="targetRules">
                                <xx-select
                                    class="selector"
                                    v-model="group.target.id"
                                    :list="targetOptionalList"
                                    placeholder="请选择目标组件"
                                    clearable
                                    filterable
                                ></xx-select>
                            </xx-form-item>
                        </xx-form>
                        <xx-form ref="backupForms" :model="group.backup">
                            <xx-form-item label="兜底组件" prop="id" :rules="backupRules">
                                <xx-select
                                    class="selector"
                                    v-model="group.backup.id"
                                    :list="backupOptionalList"
                                    placeholder="请选择兜底组件"
                                    clearable
                                    filterable
                                ></xx-select>
                            </xx-form-item>
                        </xx-form>
                    </el-collapse-item>
                </el-collapse>
            </div>

            <div class="abTestBtn">
                <el-button type="primary" plain @click="addBackupGroup">增加一组</el-button>
            </div>
        </el-collapse-item>
    </el-collapse>
</template>

<script>
import { reportCustomMetrics } from 'utils/report-custom-metrics';
import {cloneDeep} from "lodash";

// 目标组件可选类型列表
const TARGET_WHITE_LIST = [
    // 'image-header',
    // 轮播图
    'sku-carousel-header',
    // 轮播图（新）
    'carousel-goods-header',
    // 通用商品列表
    'sku-card-floor',
];

// 兜底组件可选类型列表
const BACKUP_WHITE_LIST = ['image-header'];

export default {
    data() {
        const _this = this;
        return {
            backupGroups: [],
            // 校验规则
            targetRules: [
                {
                    required: true,
                    message: '请选择组件',
                    trigger: 'blur',
                },
                {
                    validator: _this.checkRequired,
                    trigger: 'blur',
                },
                {
                    validator: _this.checkIfBackupForSameTarget,
                    trigger: 'change',
                },
            ],
            backupRules: [
                {
                    required: true,
                    message: '请选择组件',
                    trigger: 'blur',
                },
                {
                    validator: _this.checkRequired,
                    trigger: 'blur',
                },
                {
                    validator: _this.checkBaseConfig,
                    trigger: 'change',
                },
                {
                    validator: _this.checkPositionOfBackupComp,
                    trigger: 'change',
                },
                {
                    validator: _this.checkIfUseSameBackup,
                    trigger: 'change',
                },
                { validator: _this.checkIfInAb },
            ],
        };
    },
    props: {
        tree: Object,
        pageMixId: String,
        pageProps: Object,
    },
    watch: {
      pageProps(newVal) {
        if (newVal?.backupGroups) {
          this.backupGroups = newVal.backupGroups
        }
      }
    },
    computed: {
        // 目标组件可选列表
        targetOptionalList() {
            const selectedBackupIdList = this.backupGroups.map((group) => group.backup.id);
            const availableComponents = [];
            this.tree.nodeList.forEach((node, index) => {
                // 是否能被兜底
                const isTargetComponents = TARGET_WHITE_LIST.includes(node.componentId);
                // 是否已经被选择
                const isInSelectedList = selectedBackupIdList.includes(node.nodeId);
                if (isTargetComponents && !isInSelectedList) {
                    availableComponents.push({
                        label: `楼层${index + 1}-${node.componentName}-${node?.props?.name || ''}`,
                        value: node.nodeId,
                    });
                }
            });
            return availableComponents;
        },
        // 兜底组件可选列表
        backupOptionalList() {
            const selectedTargetIdList = this.backupGroups.map((group) => group.target.id);
            const availableComponents = [];
            this.tree.nodeList.forEach((node, index) => {
                // 是否能作为兜底组件
                const isBackupComponents = BACKUP_WHITE_LIST.includes(node.componentId);
                // 是否已经被选择
                const isInSelectedList = selectedTargetIdList.includes(node.nodeId);
                if (isBackupComponents && !isInSelectedList) {
                    availableComponents.push({
                        label: `楼层${index + 1}-${node.componentName}-${node?.props?.name || ''}`,
                        value: node.nodeId,
                    });
                }
            });
            return availableComponents;
        },
    },
    methods: {
        addBackupGroup() {
            this.backupGroups.push({
                id: Date.now(),
                target: { id: '' },
                backup: { id: '' },
            });
        },
        removeBackupGroup(delGroupId) {
            this.backupGroups = this.backupGroups.filter((group) => group.id !== delGroupId);
        },
        // 校验
        async validate({ abGroups = [] } = {}) {
            this.abGroups = abGroups;
            const targetValidateResult =
                this.$refs.targetForms?.map((groupForms) => {
                    return groupForms.validate();
                }) || [];
            const backupValidateResult =
                this.$refs.backupForms?.map((groupForms) => {
                    return groupForms.validate();
                }) || [];

            let validateResult, isValid;
            try {
                validateResult = await Promise.all([
                    ...targetValidateResult,
                    ...backupValidateResult,
                ]);
                isValid = true;
            } catch (e) {
                validateResult = e;
                isValid = e?.valid || false;
            }
            console.log('[backup] validate validateResult', isValid, validateResult);
            return {
                isValid,
                errMsg: isValid ? '' : '【特殊功能配置-兜底配置】异常，请根据错误提示修改',
            };
        },
        // 必填校验
        checkRequired(rule, id, cb) {
            if (!id) return cb(new Error('请选择组件'));
            return cb();
        },
        // 兜底组件配置校验，判断其是否启用了分时段、分渠道、分人群等配置，若是，则校验不通过。
        checkBaseConfig(rule, id, cb) {
            const comp = this.tree.nodeList.find((node) => node.nodeId === id);
            if (comp) {
                const { _bizSwitch, _crmSwitch, cycleTime } = comp?.props?._baseConfig || {};
                const cycleTimeSwitch = cycleTime || false;
                const { _timeRange } = comp?.props;

                if (_bizSwitch || _crmSwitch || cycleTimeSwitch || _timeRange) {
                    return cb(new Error('请去除组件的特殊配置'));
                }
            }

            cb();
        },
        // 与 ab 相关校验：判断兜底组件是否在任意实验组的桶中，若是，则校验不通过。
        checkIfInAb(rule, id, cb) {
            if (!this.abGroups) {
                return
            }
            for (const abGroup of this.abGroups) {
                if (!abGroup.experimentList) {
                    continue
                }
                for (const exp of abGroup.experimentList) {
                    if (exp.selectedComponent.includes(id)) {
                        return cb(new Error('请选择不在 ab 实验桶中的组件'));
                    }
                }
            }

            return cb();
        },
        // 兜底组件位置校验，判断所有兜底组件是否位于组件列表的最后，若不是，则校验不通过。
        checkPositionOfBackupComp(rule, id, cb) {
            if (!id) cb();
            // 计算兜底组件个数，去重
            const distinctBackupCount = new Set(this.backupGroups.map((group) => group.backup.id))
                .size;

            const compCount = this.tree.nodeList.length;
            // 计算出兜底组件所能放置的最小索引
            const backupMinIndex = compCount - distinctBackupCount;
            // 当前正在校验的兜底组件在组件列表中的位置
            const backupIndex = this.tree.nodeList.findIndex((node) => node.nodeId === id);
            if (backupIndex < backupMinIndex) {
                return cb(new Error('请将组件放在组件列表的最后'));
            }
            return cb();
        },
        checkIfBackupForSameTarget(rule, id, cb) {
            const isRepetitious =
                this.backupGroups
                    .map((group) => group.target.id)
                    .filter((backupId) => backupId === id).length > 1;
            if (isRepetitious) {
                return cb(new Error('多次为同一目标组件配置兜底'));
            }
            return cb();
        },
        checkIfUseSameBackup(rule, id, cb) {
            const isRepetitious =
                this.backupGroups
                    .map((group) => group.backup.id)
                    .filter((backupId) => backupId === id).length > 1;
            if (isRepetitious) {
                return cb(new Error('一个兜底组件只能使用一次'));
            }
            return cb();
        },
        save() {
            // backup 数据塞到 pageConfig 中
            const backupGroups = cloneDeep(this.backupGroups);
            for (const group of backupGroups) {
              const target = group.target;
              const targetIndex = this.tree.nodeList.findIndex(node => node.nodeId === target.id)
              if (targetIndex >= 0) {
                target.configIndex = targetIndex
              }
            }
            // eslint-disable-next-line vue/no-mutating-props
            this.pageProps.backupGroups = backupGroups;
            const useBackup = this.backupGroups?.length ? 1 : 0;
            reportCustomMetrics('usageCountOfBackup', useBackup, {
                pageId: this.pageMixId,
                backupGroupLength: this.backupGroups.length,
                useBackup,
            });
        },
    },
};
</script>

<style scoped>
.array-item {
    padding: 0 20px 20px 20px;
}

.array-item-header {
    width: 480px;
    height: 49px;
    display: flex;
    justify-content: space-between;
    padding-top: 15px;
}

.index-icon {
    height: 20px;
    width: 20px;
    border-radius: 20px;
    background-color: #20a0ff;
    line-height: 20px;
    vertical-align: middle;
    color: white;
    font-size: 12px;
    text-align: center;
}

.delete-icon {
    height: 20px;
    width: 20px;
    font-size: 18px;
    margin-left: auto;
    cursor: pointer;
    color: #aaa;
}

.selector {
    width: 300px;
}

.abTestBtn {
    width: 90px;
    margin: 0 auto;
}
</style>

```


## 楼层打散配置
```vue
<template>
    <el-collapse>
        <el-collapse-item title="楼层打散配置">
            <el-collapse v-for="(group, index) in splitGroupList" :key="group.id">
                <el-collapse-item>
                    <!-- 每组名称 -->
                    <template slot="title">
                        <div class="array-item-header">
                            <div class="index-icon">{{ index + 1 }}</div>
                            <div
                                class="delete-icon el-icon-circle-close"
                                @click="delSplitGroup(group.id)"
                            ></div>
                        </div>
                    </template>

                    <!-- 每组配置 -->
                    <xx-form ref="floorSplitForm" :model="group" :rules="rules">
                        <xx-form-item label="楼层打散方式" prop="splitType">
                            <el-radio-group v-model="group.splitType">
                                <el-radio
                                    v-for="item in splitTypeMap"
                                    :key="item.value"
                                    :label="item.value"
                                >
                                    {{ item.label }}
                                </el-radio>
                            </el-radio-group>
                        </xx-form-item>
                        <xx-form-item label="选择楼层" prop="splitCompList">
                            <xx-select
                                v-model="group.splitCompList"
                                class="selector"
                                :list="selectedComponentsList"
                                :disabledIds="disabledSelectedList"
                                placeholder="请选择打散组件"
                                multiple
                                clearable
                                filterable
                            ></xx-select>
                        </xx-form-item>
                    </xx-form>
                </el-collapse-item>
            </el-collapse>

            <div class="floor-split-btn">
                <el-button type="primary" plain @click="addSplitGroup">增加一组</el-button>
            </div>
        </el-collapse-item>
    </el-collapse>
</template>

<script>
import getAllEnumData from '../utils/get-all-enum-data';

export default {
    props: {
        tree: {
            type: Object,
            default: () => ({}),
        },
        pageProps: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            splitTypeMap: [
                {
                    label: '随机打散',
                    value: 1,
                },
            ],
            splitGroupList: [], // 具体配置
            canSplitComponentList: [], // 可打散组件列表
            rules: {
                splitType: [
                    { required: true, message: '请选择打散方式', trigger: ['blur', 'change'] },
                ],
                splitCompList: [
                    {
                        required: true,
                        validator: this.checkCompContinuity,
                        trigger: ['blur', 'change'],
                    },
                ],
            },
        };
    },
    computed: {
        disabledSelectedList() {
            return this.splitGroupList.flatMap((group) => group.splitCompList) || [];
        },
        selectedComponentsList() {
            const floorNavAnchorCompList = this.handleFloorNavigation();
            const tempList = [];
            this.tree.nodeList.forEach((node, index) => {
                if (!this.canSplitComponentList.includes(node.componentId)) return;
                if (floorNavAnchorCompList.includes(node.nodeId)) return;

                tempList.push({
                    label: `${index + 1}楼层 - ${node.componentName}-${node.props.name}`,
                    value: node.nodeId,
                    originIndex: index,
                });
            });

            return tempList;
        },
    },
    watch: {
        pageProps: {
            handler(newVal) {
                if (newVal?.splitGroupList) {
                    this.splitGroupList = newVal.splitGroupList.map((group) => ({
                        splitType: group.splitType,
                        splitCompList: group.splitCompList.map((item) => item.nodeId)
                    }))
                }
            },
        },
        tree: {
            handler() {
                this.handleSplitCompList();
            },
            deep: true,
        },
    },
    async mounted() {
        const allEnumData = await getAllEnumData.fetchEnumData() || {};
        this.canSplitComponentList = allEnumData["4"]?.map((comp) => comp?.value) || ['sku-card-floor']
    },
    methods: {
        addSplitGroup() {
            this.splitGroupList.push({
                id: Date.now(),
                splitType: 1,
                splitCompList: [],
            });
        },
        delSplitGroup(delId) {
            const index = this.splitGroupList.findIndex((group) => group.id === delId);
            if (index !== -1) {
                this.splitGroupList.splice(index, 1);
            }
        },
        handleFloorNavigation(){
            let floorNavAnchorCompList = [];
            this.tree.nodeList.forEach((node) => {
                if (node.componentId !== 'floor-navigation-floor') return;
                floorNavAnchorCompList = node.props.floorNavigationConfig?.map(
                    (anchor) => anchor.anchorComponent
                );
            });

            return floorNavAnchorCompList;
        },
        handleSplitCompList() {
            // 楼层有变动，删除 - 去除 打散组件中 已选择的删除组件；楼层导航锚定组件变为通用列表，去除打散组件中 已选择的楼层导航锚定组件
            const floorNavAnchorCompList = this.handleFloorNavigation();
            const validNodeIds = new Set(
                this.tree.nodeList
                .map(node => node.nodeId)
                .filter(id => !floorNavAnchorCompList.includes(id))
            );

            this.splitGroupList.forEach(group => {
                group.splitCompList = group.splitCompList.filter(compId => validNodeIds.has(compId));
            });
        },
        save() {
            let validRes = true
            this.$refs?.floorSplitForm?.forEach((form) => {
                form.validate((valid) => {
                    if (!valid) validRes = false;
                });
            })
            if (!validRes) return false

            const splitConfig = this.splitGroupList.map((group) => {
                return {
                    splitType: group.splitType,
                    splitCompList: group.splitCompList.map((nodeId)=> {
                        const index = this.selectedComponentsList.find((item) => item.value === nodeId)?.originIndex
                        return {
                            index,
                            nodeId,
                        }
                    }),
                };
            });
            return splitConfig;
        },
        checkCompContinuity(rule, value, cb) {
            if (!(value && value.length)) {
                return cb(new Error('请选择楼层'));
            }

            if(value.length < 2) {
                return cb(new Error('请选择至少两个楼层'))
            }

            // 检查楼层是否连续
            const indics = value.map((nodeId) => this.selectedComponentsList.find((item) => item.value === nodeId).originIndex);
            indics.sort((a, b) => a - b);
            for (let i = 1; i < indics.length; i++) {
                if (indics[i] - indics[i - 1] !== 1) {
                    return cb(new Error('一组内楼层必须连续'));
                }
            }
            return cb();
        },
    },
};
</script>
```

