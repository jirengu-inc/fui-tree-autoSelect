import React, {ChangeEventHandler, useEffect, useRef} from 'react';
import {scopedClassMaker} from '../helpers/classes';
import useUpdate from '../hooks/useUpdate';
import useToggle from '../hooks/useToggle';

interface Props {
  item: SourceDataItem;
  level: number;
  treeProps: TreeProps;
  onItemChange: (values: string[]) => void;
}

interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}

const scopedClass = scopedClassMaker('fui-tree');
const sc = scopedClass;

const TreeItem: React.FC<Props> = (props) => {
  const {item, level, treeProps} = props;
  const classes = {
    ['level-' + level]: true,
    'item': true
  };
  const checked = treeProps.multiple ?
    treeProps.selected.indexOf(item.value) >= 0 :
    treeProps.selected === item.value;

  const {value: expanded, expand, collapse} = useToggle(true);

  const divRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useUpdate(expanded, () => {
    if (!divRef.current) {return;}
    if (expanded) {
      divRef.current.style.position = 'absolute';
      divRef.current.style.opacity = '0';
      divRef.current.style.height = 'auto';
      const {height} = divRef.current.getBoundingClientRect();
      divRef.current.style.position = '';
      divRef.current.style.opacity = '';
      divRef.current.style.height = '0px';
      divRef.current.getBoundingClientRect();
      divRef.current.style.height = height + 'px';
      const afterExpand = () => {
        if (!divRef.current) {return;}
        divRef.current.style.height = '';
        divRef.current.classList.add('fui-tree-children-present');
        divRef.current.removeEventListener('transitionend', afterExpand);
      };
      divRef.current.addEventListener('transitionend', afterExpand);
    } else {
      const {height} = divRef.current.getBoundingClientRect();
      divRef.current.style.height = height + 'px';
      divRef.current.getBoundingClientRect();
      divRef.current.style.height = '0px';
      const afterCollapse = () => {
        if (!divRef.current) {return;}
        divRef.current.style.height = '';
        divRef.current.classList.add('fui-tree-children-gone');
        divRef.current.removeEventListener('transitionend', afterCollapse);
      };
      divRef.current.addEventListener('transitionend', afterCollapse);
    }
  });

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const childrenValues = collectChildrenValues(item);
    if (treeProps.multiple) {
      if (e.target.checked) {
        props.onItemChange([...treeProps.selected, item.value, ...childrenValues]);
      } else {
        props.onItemChange(treeProps.selected.filter(value =>
          value !== item.value && childrenValues.indexOf(value) === -1)
        );
      }
    } else {
      if (e.target.checked) {
        treeProps.onChange(item.value);
      } else {
        treeProps.onChange('');
      }
    }
  };
  const onItemChange = (values: string[]) => {
    const childrenValues = collectChildrenValues(item);
    const common = intersect(values, childrenValues);
    if (common.length !== 0) {
      props.onItemChange(Array.from(new Set(values.concat(item.value))));
      inputRef.current!.indeterminate = common.length !== childrenValues.length;
    } else {
      props.onItemChange(values.filter(v => v !== item.value));
      inputRef.current!.indeterminate = false;
    }
  };


  return <div key={item.value} className={sc(classes)}>
    <div className={sc('text')}>
      <input ref={inputRef} type="checkbox" onChange={onChange} checked={checked}/>
      {item.text}
      {item.children &&
      <span onSelect={e => e.preventDefault()}>
          {expanded ?
            <span onClick={collapse}>-</span> :
            <span onClick={expand}>+</span>
          }
        </span>
      }
    </div>
    <div ref={divRef} className={sc({children: true, collapsed: !expanded})}>
      {item.children?.map(sub =>
        <TreeItem key={sub.value} item={sub} level={level + 1} onItemChange={onItemChange} treeProps={treeProps}/>
      )}
    </div>
  </div>;
};


export default TreeItem;

function collectChildrenValues(item: SourceDataItem): string[] {
  return flatten(item.children?.map(i => [i.value, collectChildrenValues(i)]));
}

function flatten(array?: RecursiveArray<string>): string[] {
  if (!array) {return [];}
  return array.reduce<string[]>((result, current) =>
    result.concat(typeof current === 'string' ? current : flatten(current)), []);
  // const result = [];
  // for (let i = 0; i < array.length; i++) {
  //   if (array[i] instanceof Array) {
  //     result.push(...flatten(array[i] as RecursiveArray<string>));
  //   } else {
  //     result.push(array[i] as string);
  //   }
  // }
  // return result;
}

function intersect<T>(array1: T[], array2: T[]): T[] {
  const result: T[] = [];
  for (let i = 0; i < array1.length; i++) {
    if (array2.indexOf(array1[i]) >= 0) {
      result.push(array1[i]);
    }
  }
  return result;
}

